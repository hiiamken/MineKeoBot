"use strict";
// src/admincommands/slash/verifyInteraction.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStartVerification = handleStartVerification;
const discord_js_1 = require("discord.js");
const captchaUtils_1 = require("../../utils/captchaUtils");
const verifyHandler_1 = require("../../handlers/verifyHandler");
// Map lưu captcha: userId -> captcha text
const captchaMap = new Map();
/** Thời gian hết hạn captcha (ms) */
const CAPTCHA_EXPIRE_MS = 30_000;
/** Thời gian chờ xác minh trong DM (ms) */
const TIMEOUT_MS = 3 * 60_000; // 3 phút
/**
 * Khi user bấm nút “Xác minh” (customId: 'start_verification')
 * => Bot tạo captcha và gửi DM cho user với hướng dẫn nhập mã.
 */
async function handleStartVerification(interaction) {
    const user = interaction.user;
    const guild = interaction.guild;
    if (!guild) {
        return interaction.reply({
            content: 'Bot không thể lấy thông tin guild!',
            ephemeral: true,
        });
    }
    // 1) Tạo captcha
    const { buffer, text } = (0, captchaUtils_1.generatePinkishCaptchaImage)(5);
    // Lưu đáp án vào map (chuyển thành chữ thường)
    captchaMap.set(user.id, text.toLowerCase());
    // 2) Thử mở DM
    try {
        const dm = await user.createDM();
        // 3) Tạo embed captcha với thiết kế mới (tiếng Việt)
        const captchaEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('🔐 XÁC MINH TÀI KHOẢN')
            .setDescription(`
  Vui lòng nhập **mã captcha** bên dưới nhằm chứng minh bạn là **người thật**.
  
  Hướng dẫn cách xác minh:
  •  Nhập các ký tự từ **trái** sang **phải**.
  •  Chỉ lấy các ký tự trong vạch màu hồng.
  •  Không phân biệt chữ **hoa/thường**.
  `)
            .setColor('#DEA2DD')
            .setImage('attachment://captcha.png')
            .setFooter({ text: 'Thời gian xác minh: 3 phút' })
            .setTimestamp();
        const attachment = new discord_js_1.AttachmentBuilder(buffer, { name: 'captcha.png' });
        // 4) Gửi tin nhắn DM chứa captcha và hướng dẫn
        await dm.send({
            embeds: [captchaEmbed],
            files: [attachment],
        });
        // 5) Tạo collector trong DM để lắng nghe tin nhắn của user
        const filter = (m) => m.author.id === user.id;
        const collector = dm.createMessageCollector({ filter, time: TIMEOUT_MS, max: 1 });
        collector.on('collect', async (msg) => {
            const code = msg.content.trim().toLowerCase();
            const correct = captchaMap.get(user.id);
            if (!correct) {
                await msg.reply('❌ Captcha đã hết hạn. Vui lòng bấm "Xác minh" lại.');
                return;
            }
            if (code === correct) {
                captchaMap.delete(user.id);
                // Lấy member từ guild
                const member = await guild.members.fetch(user.id);
                await (0, verifyHandler_1.handleUserVerificationSuccess)(member);
            }
            else {
                // Lấy member để xử lý thất bại
                const member = await guild.members.fetch(user.id);
                await (0, verifyHandler_1.handleUserVerificationFail)(member);
            }
        });
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                captchaMap.delete(user.id);
                dm.send('⏰ Hết thời gian xác minh, vui lòng bấm "Xác minh" lại.').catch(() => null);
            }
        });
        // Thay vì "Tôi đã gửi DM...", ta gửi embed ephemeral với icon <a:PinkLoading:ID>
        const ephemeralEmbed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setDescription(`
<a:PinkLoading:1346672442751582349> **Đang khởi động xác minh...**  
Vui lòng kiểm tra **tin nhắn riêng (DM)** với bot để nhập mã captcha!
`);
        await interaction.reply({
            embeds: [ephemeralEmbed],
            ephemeral: true,
        });
    }
    catch (err) {
        console.error('Không thể gửi DM:', err);
        // Tạo embed hướng dẫn bật DM
        const dmFailEmbed = new discord_js_1.EmbedBuilder()
            .setColor('#e74c3c') // màu đỏ nhẹ
            .setTitle('Không thể gửi tin nhắn riêng (DM)')
            .setDescription(`
  Bot không thể gửi tin nhắn xác minh đến bạn vì DM (tin nhắn riêng) đang bị tắt hoặc hạn chế.
  
  **Cách bật DM (trên Discord PC)**:
  1. Vào **User Settings** (biểu tượng bánh răng góc trái dưới).
  2. Chọn **Privacy & Safety**.
  3. Bật tùy chọn **"Allow direct messages from server members"**.
  
  Hoặc bạn có thể điều chỉnh cài đặt tương tự trên mobile (Cài đặt -> Quyền riêng tư & An toàn).
  
  Sau khi bật DM, hãy **bấm lại nút "Xác minh"** để bot gửi mã captcha cho bạn!
  `);
        await interaction.reply({
            embeds: [dmFailEmbed],
            ephemeral: true,
        });
    }
}

"use strict";
// src/handlers/verifyHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserVerificationSuccess = handleUserVerificationSuccess;
exports.handleUserVerificationFail = handleUserVerificationFail;
const discord_js_1 = require("discord.js");
const verifyLog_1 = require("../database/verifyLog");
const guildMemberAdd_1 = require("../events/guildMemberAdd");
/**
 * ID role “Chưa xác thực” và “Đã xác thực”
 */
const UNVERIFIED_ROLE_ID = '1132115518141235220';
const VERIFIED_ROLE_ID = '1121769384646561843';
/**
 * Hàm xử lý khi user xác minh **thành công**.
 * - Gỡ role “Chưa xác thực”, thêm role “Đã xác thực”
 * - Ghi nhận vào DB (markUserVerified)
 * - Gửi embed thông báo **thành công** qua DM
 * - Gọi hàm sendWelcomeMessage
 */
async function handleUserVerificationSuccess(member, interaction) {
    try {
        // Ghi nhận xác minh vào DB
        await (0, verifyLog_1.markUserVerified)(member.id);
        // Gỡ role cũ, thêm role mới
        const unverifiedRole = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);
        const verifiedRole = member.guild.roles.cache.get(VERIFIED_ROLE_ID);
        if (unverifiedRole)
            await member.roles.remove(unverifiedRole);
        if (verifiedRole)
            await member.roles.add(verifiedRole);
        // Tạo Embed thành công
        const successEmbed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setDescription(`✅ **Bạn đã xác minh thành công!**\n\n` +
            `Bạn là người thật và bây giờ **có thể truy cập tất cả các kênh** trong server.`);
        // Gửi DM thông báo thành công
        try {
            const dm = await member.createDM();
            await dm.send({ embeds: [successEmbed] });
        }
        catch (err) {
            console.error(`Không gửi được DM thành công cho ${member.user.tag}:`, err);
        }
        // Gửi tin nhắn chào mừng
        await (0, guildMemberAdd_1.sendWelcomeMessage)(member);
        // (Tuỳ chọn) Nếu muốn phản hồi gì đó cho Interaction (nếu còn):
        // if (interaction && !interaction.replied && !interaction.deferred) {
        //   await interaction.reply({ content: 'Bạn đã xác minh thành công!', ephemeral: true });
        // }
    }
    catch (error) {
        console.error(`❌ Lỗi khi xác minh user ${member.id}:`, error);
    }
}
/**
 * Hàm xử lý khi user xác minh **thất bại** (nhập sai captcha, v.v.).
 * - Gửi Embed thông báo **thất bại** qua DM
 */
async function handleUserVerificationFail(member, reason = 'Bạn đã nhập sai mã captcha hoặc hết thời gian xác minh.') {
    // Tạo Embed thất bại
    const failEmbed = new discord_js_1.EmbedBuilder()
        .setColor('#DEA2DD')
        .setDescription(`❌ **Xác minh thất bại!**\n\n${reason}`);
    try {
        const dm = await member.createDM();
        await dm.send({ embeds: [failEmbed] });
    }
    catch (err) {
        console.error(`Không gửi được DM thất bại cho ${member.user.tag}:`, err);
    }
}

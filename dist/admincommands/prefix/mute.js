"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.muteCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.muteCommand = {
    name: "mute",
    description: "Cấm nói một người dùng trong khoảng thời gian nhất định.",
    async execute(message, args) {
        if (!message.member || !(0, config_1.hasPermission)(message.member)) {
            return message.reply({
                content: "🚫 Bạn không có quyền sử dụng lệnh này!",
            });
        }
        if (!message.guild)
            return;
        const userId = args[0]?.replace(/[<@!>]/g, "");
        const duration = args[1] || "5m"; // Mặc định 5 phút nếu không nhập
        const reason = args.slice(2).join(" ") || "Không có lý do cụ thể";
        const caseId = `MK-${Date.now().toString(36).toUpperCase()}`; // Tạo Case ID hợp lệ
        if (!userId) {
            return message.reply({
                content: "⚠ Vui lòng cung cấp ID hoặc mention người cần mute.",
            });
        }
        const user = await message.guild.members.fetch(userId).catch(() => null);
        if (!user) {
            return message.reply({
                content: "⚠ Người dùng không tồn tại trong server.",
            });
        }
        // 🔥 Kiểm tra nếu bot có quyền "Timeout Members"
        if (!message.guild.members.me?.permissions.has(discord_js_1.PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({
                content: "⚠ Bot không có quyền cấm nói người dùng! Hãy kiểm tra quyền của bot.",
            });
        }
        // 🔥 Kiểm tra nếu bot có role cao hơn người bị mute
        if (message.guild.members.me.roles.highest.position <=
            user.roles.highest.position) {
            return message.reply({
                content: "⚠ Bot không thể mute người có quyền cao hơn hoặc ngang bằng nó!",
            });
        }
        // 🔥 Kiểm tra nếu người mute có quyền cao hơn người gửi lệnh
        if (message.member.roles.highest.position <= user.roles.highest.position) {
            return message.reply({
                content: "⚠ Bạn không thể mute người có quyền cao hơn hoặc ngang bằng bạn!",
            });
        }
        const timeMs = parseDuration(duration);
        if (!timeMs) {
            return message.reply({
                content: "⚠ Thời gian không hợp lệ! Ví dụ: `1m`, `5m`, `2h`",
            });
        }
        try {
            await user.timeout(timeMs, reason);
            // 🔥 Lưu log vào database
            await (0, database_1.logInfraction)(message.guild.id, user.id, message.author.id, "mute", reason, duration);
            // 📜 Embed chuyên nghiệp
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("#DEA2DD")
                .setTitle("\`⏳\` Xử lý vi phạm - Mute")
                .setDescription(`
  \`📌\` **Action Information**
  > **Người dùng:** <@${user.id}>
  > **Người xử lý:** <@${message.author.id}>
  > **ID:** \`${caseId}\`

  \`⏰\` **Timeout Information**
  > **Lý do:** ${reason}
  > **Thời gian:** ${duration}
  > **Hết hạn:** <t:${Math.floor((Date.now() + timeMs) / 1000)}:F>
  `)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({
                text: `Xử lý bởi: ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
            })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        }
        catch (error) {
            console.error("Lỗi khi mute:", error);
            return message.reply({
                content: "⚠ Đã xảy ra lỗi khi mute người dùng. Vui lòng kiểm tra lại quyền của bot!",
            });
        }
    },
};
// 🔄 Hàm chuyển đổi thời gian từ `1m`, `5m`, `2h`
function parseDuration(duration) {
    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if (!match)
        return null;
    const value = parseInt(match[1]);
    const unit = duration.slice(-1);
    const unitMultipliers = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000,
    };
    return value * (unitMultipliers[unit] || 0);
}

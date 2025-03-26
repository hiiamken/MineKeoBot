"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kickCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.kickCommand = {
    name: 'kick',
    description: 'Đuổi một người dùng khỏi server.',
    async execute(message, args) {
        if (!message.member || !(0, config_1.hasPermission)(message.member)) {
            return message.reply('🚫 Bạn không có quyền sử dụng lệnh này!');
        }
        if (!message.guild)
            return;
        const userId = args[0]?.replace(/[<@!>]/g, '');
        const reason = args.slice(1).join(' ') || 'Không có lý do cụ thể';
        const caseId = `MK-${Date.now().toString(36).toUpperCase()}`;
        if (!userId) {
            return message.reply('⚠ Vui lòng cung cấp ID hoặc mention người cần đuổi.');
        }
        const user = await message.guild.members.fetch(userId).catch(() => null);
        if (!user) {
            return message.reply('⚠ Người dùng không tồn tại trong server.');
        }
        if (message.member.roles.highest.position <= user.roles.highest.position) {
            return message.reply('⚠ Bạn không thể kick người có quyền cao hơn hoặc ngang bằng bạn!');
        }
        try {
            await user.kick(reason);
            await (0, database_1.logInfraction)(message.guild.id, user.id, message.author.id, 'kick', reason);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('👢 Xử lý vi phạm - Kick')
                .setDescription(`
  \`📌\` **Thông tin vi phạm**
  > **Người dùng:** <@${user.id}>
  > **Người xử lý:** <@${message.author.id}>
  > **ID:** \`${caseId}\`

  \`🚀\` **Lý do**
  > **Lý do:** ${reason}
  `)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: `Xử lý bởi: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        }
        catch (error) {
            console.error('Lỗi khi kick:', error);
            return message.reply('⚠ Đã xảy ra lỗi khi đuổi người dùng.');
        }
    }
};

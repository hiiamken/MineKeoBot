"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmuteCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.unmuteCommand = {
    name: 'unmute',
    description: 'Gỡ mute một người dùng.',
    async execute(message, args) {
        if (!message.member || !(0, config_1.hasPermission)(message.member)) {
            return message.channel.send('🚫 Bạn không có quyền sử dụng lệnh này!');
        }
        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.channel.send('⚠ Vui lòng cung cấp ID hoặc mention người cần gỡ mute.');
        }
        const user = await message.guild?.members.fetch(userId).catch(() => null);
        if (!user) {
            return message.channel.send('⚠ Người dùng không tồn tại hoặc không bị mute.');
        }
        // Kiểm tra quyền hạn trước khi unmute
        if (!(0, config_1.hasPermission)(message.member, user)) {
            return message.channel.send('⚠ Bạn không thể gỡ mute người có quyền cao hơn hoặc ngang bằng bạn.');
        }
        try {
            await user.timeout(null);
            // Lưu log vào database
            await (0, database_1.logInfraction)(message.guild.id, user.id, message.author.id, 'unmute', 'Gỡ mute thành công');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('🔊 Đã Gỡ Mute')
                .setDescription(`👤 Người dùng **${user.user.tag}** đã được gỡ mute bởi **${message.author.tag}**.`)
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        }
        catch (error) {
            console.error('Lỗi khi gỡ mute:', error);
            return message.channel.send('⚠ Đã xảy ra lỗi khi gỡ mute người dùng.');
        }
    }
};

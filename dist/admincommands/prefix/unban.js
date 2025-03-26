"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbanCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.unbanCommand = {
    name: 'unban',
    description: 'Gỡ cấm một người dùng khỏi server.',
    async execute(message, args) {
        if (!message.member || !(0, config_1.hasPermission)(message.member)) {
            return message.channel.send('🚫 Bạn không có quyền sử dụng lệnh này!');
        }
        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.channel.send('⚠ Vui lòng cung cấp ID của người cần gỡ cấm.');
        }
        try {
            await message.guild?.bans.remove(userId);
            // Lưu log vào database
            await (0, database_1.logInfraction)(message.guild.id, userId, message.author.id, 'unban', 'Gỡ cấm thành công');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('🔓 Gỡ Cấm Thành Viên')
                .setDescription(`✅ Người dùng <@${userId}> đã được gỡ cấm bởi **${message.author.tag}**.`)
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        }
        catch (error) {
            console.error('Lỗi khi unban:', error);
            message.channel.send('⚠ Đã xảy ra lỗi khi gỡ cấm người dùng.');
        }
    }
};

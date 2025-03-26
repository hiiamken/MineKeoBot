"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topmessagesPrefixCommand = void 0;
const discord_js_1 = require("discord.js");
const messages_1 = require("../../database/messages");
exports.topmessagesPrefixCommand = {
    name: 'topmessages',
    description: 'Xem bảng xếp hạng 10 người đã gửi nhiều tin nhắn nhất (prefix)',
    async execute(message, args) {
        if (!message.guild)
            return;
        // Lấy top 10 người có số lượng tin nhắn cao nhất
        const topMessages = await (0, messages_1.getTopMessageSenders)(message.guild.id, 10);
        if (topMessages.length === 0) {
            if (message.channel.isTextBased()) {
                const ch = message.channel;
                return ch.send('Chưa có dữ liệu tin nhắn cho server này!');
            }
            return;
        }
        // Mỗi dòng: [ rank ] | 📝 Messages: X - @mention
        const lines = topMessages.map((player, index) => {
            const rank = index + 1;
            return (`\`[ ${rank} ]\` **| 📝 Tin nhắn:** \`${player.message_count.toLocaleString()}\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`);
        });
        // Tạo Embed
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`📝` | Bảng Xếp Hạng Tin Nhắn')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n'))
            .setTimestamp();
        // Gửi Embed
        if (message.channel.isTextBased()) {
            const ch = message.channel;
            await ch.send({ embeds: [embed] });
        }
    },
};

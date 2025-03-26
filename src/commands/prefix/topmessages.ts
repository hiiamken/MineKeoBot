import {
    Message,
    TextChannel,
    DMChannel,
    ThreadChannel,
    EmbedBuilder
} from 'discord.js';
import { getTopMessageSenders } from '../../database/messages';

export const topmessagesPrefixCommand = {
    name: 'topmessages',
    description: 'Xem bảng xếp hạng 10 người đã gửi nhiều tin nhắn nhất (prefix)',
    async execute(message: Message, args: string[]) {
        if (!message.guild) return;

        // Lấy top 10 người có số lượng tin nhắn cao nhất
        const topMessages = await getTopMessageSenders(message.guild.id, 10);
        if (topMessages.length === 0) {
            if (message.channel.isTextBased()) {
                const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
                return ch.send('Chưa có dữ liệu tin nhắn cho server này!');
            }
            return;
        }

        // Mỗi dòng: [ rank ] | 📝 Messages: X - @mention
        const lines = topMessages.map((player, index) => {
            const rank = index + 1;
            return (
                `\`[ ${rank} ]\` **| 📝 Tin nhắn:** \`${player.message_count.toLocaleString()}\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`
            );
        });

        // Tạo Embed
        const embed = new EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`📝` | Bảng Xếp Hạng Tin Nhắn')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n'))
            .setTimestamp();

        // Gửi Embed
        if (message.channel.isTextBased()) {
            const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
            await ch.send({ embeds: [embed] });
        }
    },
};

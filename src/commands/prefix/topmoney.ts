import {
    Message,
    TextChannel,
    DMChannel,
    ThreadChannel,
    EmbedBuilder
} from 'discord.js';
import { getTopBalances } from '../../database/economy';

export const topmoneyPrefixCommand = {
    name: 'topmoney',
    description: 'Xem bảng xếp hạng 10 người có nhiều tiền nhất (prefix)',
    async execute(message: Message, args: string[]) {
        if (!message.guild) return;

        // Lấy top 10 người giàu nhất
        const topBalances = await getTopBalances(message.guild.id, 10);
        if (topBalances.length === 0) {
            if (message.channel.isTextBased()) {
                const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
                return ch.send('Chưa có dữ liệu tiền cho server này!');
            }
            return;
        }

        // Mỗi dòng: [ rank ] | 💰 Money: X VNĐ - @mention
        // Rồi xuống dòng hiển thị (user_id)
        const lines = topBalances.map((player, index) => {
            const rank = index + 1;
            return (
                `\`[ ${rank} ]\` **| 💰 Tiền:** \`${player.money.toLocaleString()} VNĐ\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`
            );
        });

        // Tạo Embed
        const embed = new EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`💰` | Bảng Xếp Hạng Tiền')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n'))
            .setTimestamp(); // không có footer

        // Gửi Embed
        if (message.channel.isTextBased()) {
            const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
            await ch.send({ embeds: [embed] });
        }
    },
};

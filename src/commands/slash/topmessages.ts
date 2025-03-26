import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder
} from 'discord.js';
import { getTopMessageSenders } from '../../database/messages';

export const topmessagesSlashCommand = {
    data: new SlashCommandBuilder()
        .setName('topmessages')
        .setDescription('Xem bảng xếp hạng 10 người đã gửi nhiều tin nhắn nhất (slash)'),
    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: 'Lệnh này chỉ có thể sử dụng trong server!', ephemeral: true });
            return;
        }

        // Lấy top 10 người có số lượng tin nhắn cao nhất
        const topMessages = await getTopMessageSenders(guild.id, 10);
        if (topMessages.length === 0) {
            return interaction.reply('Chưa có dữ liệu tin nhắn cho server này!');
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

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};

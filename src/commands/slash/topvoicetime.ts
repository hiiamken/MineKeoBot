import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder
} from 'discord.js';
import { getTopVoiceUsers } from '../../database/voicetimes';

export const topvoicetimeSlashCommand = {
    data: new SlashCommandBuilder()
        .setName('topvoicetime')
        .setDescription('Xem bảng xếp hạng 10 người có thời gian voice cao nhất (slash)'),
    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: 'Lệnh này chỉ có thể sử dụng trong server!', ephemeral: true });
            return;
        }

        // Lấy top 10 người có thời gian voice cao nhất
        const topVoiceUsers = await getTopVoiceUsers(guild.id, 10);
        if (topVoiceUsers.length === 0) {
            return interaction.reply('Chưa có dữ liệu voice time cho server này!');
        }

        // Mỗi dòng: [ rank ] | 🎤 Time: Xh Ym Zs - @mention
        const lines = topVoiceUsers.map((player, index) => {
            const rank = index + 1;
            const timeStr = formatVoiceTime(player.total_time);
            return (
                `\`[ ${rank} ]\` **| 🎤 Voice Time:** \`${timeStr}\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`
            );
        });

        // Tạo Embed
        const embed = new EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`🎤` | Bảng Xếp Hạng Voice Time')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n'))
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};

/**
 * Chuyển đổi thời gian voice từ giây sang định dạng `Xh Ym Zs`
 */
function formatVoiceTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${hours}h ${minutes}m ${sec}s`;
}

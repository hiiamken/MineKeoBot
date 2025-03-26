import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getUserLevel, getRequiredXp } from '../../levels/levelManager';

/**
 * Tạo thanh tiến trình dạng text.
 * @param currentXP XP hiện tại
 * @param requiredXP XP cần để lên level
 * @param barLength Độ dài thanh (mặc định 20)
 * @returns Thanh tiến trình dạng text (ví dụ: `█████░░░░░░░░░░░`)
 */
function createProgressBar(currentXP: number, requiredXP: number, barLength = 20): string {
  const progress = Math.floor((currentXP / requiredXP) * barLength);
  const bar = '█'.repeat(progress) + '░'.repeat(barLength - progress);
  return `\`${bar}\``;
}

export const levelSlashCommand = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Hiển thị cấp độ và kinh nghiệm của bạn hoặc của người khác.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Người dùng cần kiểm tra cấp độ (nếu không chọn, kiểm tra của bạn)')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'Lệnh này chỉ có thể sử dụng trong server!', ephemeral: true });
      return;
    }

    // Lấy người dùng từ option; nếu không có, sử dụng người gọi lệnh
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const { xp, level } = await getUserLevel(guild.id, targetUser.id);
    const required = getRequiredXp(level);
    const progressBar = createProgressBar(xp, required, 20);
    const percent = ((xp / required) * 100).toFixed(1);

    // Tạo Embed với tiêu đề có icon trong dấu backticks và các field bắt đầu bằng ">"
    const embed = new EmbedBuilder()
      .setColor('#DEA2DD')
      .setTitle('`🏆` | Thông Tin Cấp Độ')
      .setThumbnail(targetUser.displayAvatarURL({ forceStatic: false, size: 128 }))
      .addFields({
        name: 'Cấp Độ',
        value:
          `> **Cấp**: ${level}\n` +
          `> **XP**: ${xp} / ${required} (${percent}%)\n` +
          `> **Tiến Trình**: ${progressBar}`,
        inline: false,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};

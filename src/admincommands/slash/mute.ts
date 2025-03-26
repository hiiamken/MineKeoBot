import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, GuildMember } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const muteCommand = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Cấm nói một người dùng trong khoảng thời gian nhất định.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Người dùng cần mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Thời gian mute (ví dụ: 1m, 5m, 2h)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do mute')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
      return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
    }

    if (!hasPermission(interaction.member)) {
      return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
    }

    const user = interaction.options.getMember('user') as GuildMember;
    const duration = interaction.options.getString('duration')!;
    const reason = interaction.options.getString('reason') || 'Không có lý do cụ thể';
    const caseId = `MK-${Date.now().toString(36).toUpperCase()}`; // Tạo Case ID hợp lệ

    if (!user) {
      return interaction.reply({ content: '⚠ Không thể tìm thấy người dùng này.', ephemeral: true });
    }

    if (interaction.member.roles.highest.position <= user.roles.highest.position) {
      return interaction.reply({ content: '⚠ Bạn không thể mute người có quyền cao hơn hoặc ngang bằng bạn!', ephemeral: true });
    }

    const timeMs = parseDuration(duration);
    if (!timeMs) {
      return interaction.reply({ content: '⚠ Thời gian không hợp lệ! Ví dụ: `1m`, `5m`, `2h`', ephemeral: true });
    }

    try {
      await user.timeout(timeMs, reason);

      // Lưu log vào database
      await logInfraction(interaction.guild!.id, user.id, interaction.user.id, 'mute', reason, duration);

      const embed = new EmbedBuilder()
        .setColor("#DEA2DD")
        .setTitle("`⏳` Xử lý vi phạm - Mute")
        .setDescription(
          `
  \`📌\` **Thông tin vi phạm**
  > **Người dùng:** <@${user.id}>
  > **Người xử lý:** <@${interaction.user.id}>
  > **ID:** \`${caseId}\`

  \`⏰\` **Thời gian và lý do**
  > **Lý do:** ${reason}
  > **Thời gian:** ${duration}
  > **Hết hạn:** <t:${Math.floor((Date.now() + timeMs) / 1000)}:F>
  `
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({
          text: `Xử lý bởi: ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi khi mute:', error);
      return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi mute người dùng.', ephemeral: true });
    }
  }
};

// Hàm chuyển đổi thời gian
function parseDuration(duration: string): number | null {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  const unitMultipliers: { [key: string]: number } = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (unitMultipliers[unit] || 0);
}

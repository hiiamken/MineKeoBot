import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const unmuteCommand = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Gỡ mute cho người dùng.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Người dùng cần gỡ mute')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
      return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
    }

    if (!hasPermission(interaction.member)) {
      return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
    }

    const user = interaction.options.getMember('user') as GuildMember;
    if (!user) {
      return interaction.reply({ content: '⚠ Không thể tìm thấy người dùng này.', ephemeral: true });
    }

    // Kiểm tra quyền hạn trước khi unmute
    if (!hasPermission(interaction.member as GuildMember, user)) {
      return interaction.reply({ content: '⚠ Bạn không thể gỡ mute người có quyền cao hơn hoặc ngang bằng bạn.', ephemeral: true });
    }

    try {
      await user.timeout(null);

      // Lưu log vào database
      await logInfraction(interaction.guild!.id, user.id, interaction.user.id, 'unmute', 'Gỡ mute thành công');

      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('🔊 Đã Gỡ Mute')
        .setDescription(`👤 Người dùng **${user.user.tag}** đã được gỡ mute bởi **${interaction.user.tag}**.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi khi gỡ mute:', error);
      return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi gỡ mute người dùng.', ephemeral: true });
    }
  }
};

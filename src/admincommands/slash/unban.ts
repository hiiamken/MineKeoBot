import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, TextChannel, PermissionFlagsBits, GuildMember } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const unbanCommand = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Gỡ cấm một người dùng khỏi server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
      option.setName('user')
        .setDescription('ID của người dùng cần gỡ cấm')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
      return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
    }

    if (!hasPermission(interaction.member)) {
      return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
    }

    const userId = interaction.options.getString('user');
    if (!userId) {
      return interaction.reply({ content: '⚠️ Vui lòng nhập ID của người cần gỡ cấm.', ephemeral: true });
    }

    try {
      await interaction.guild?.bans.remove(userId);

      // Lưu log vào database
      await logInfraction(interaction.guild!.id, userId, interaction.user.id, 'unban', 'Gỡ cấm thành công');

      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('🛑 Gỡ Cấm Thành Viên')
        .setDescription(`👤 Người dùng <@${userId}> đã được gỡ cấm bởi **${interaction.user.tag}**.`)
        .setTimestamp();

      await (interaction.channel as TextChannel).send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Người dùng đã được gỡ cấm!', ephemeral: true });
    } catch (error) {
      console.error('Lỗi khi unban:', error);
      return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi gỡ cấm người dùng.', ephemeral: true });
    }
  }
};

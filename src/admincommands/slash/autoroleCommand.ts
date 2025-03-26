import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { setAutorole } from '../../config/config';

export const autoroleCommand = {
  data: new SlashCommandBuilder()
    .setName('setautorole')
    .setDescription('Thiết lập role tự động cho người tham gia mới.')
    .addStringOption(option =>
      option
        .setName('role_id')
        .setDescription('ID của role sẽ được gán tự động cho thành viên mới.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'Lệnh này chỉ dùng trong server!', ephemeral: true });
    }
    
    const roleId = interaction.options.getString('role_id', true);
    // Lưu roleId vào config hoặc database (ví dụ: file config hoặc bảng config)
    await setAutorole(interaction.guild.id, roleId);

    return interaction.reply({ content: `✅ Đã cập nhật autorole thành công với role ID: ${roleId}`, ephemeral: true });
  }
};

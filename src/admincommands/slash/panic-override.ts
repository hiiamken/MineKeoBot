// src/admincommands/slash/panic-override.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { disablePanicMode, isPanicModeActive } from '../../automod/panicMode';

export const panicOverrideCommand = {
  data: new SlashCommandBuilder()
    .setName('panic-override')
    .setDescription('Tắt Panic Mode thủ công nếu bạn biết là false positive.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Chỉ dùng trong server.', ephemeral: true });
    
    if (!isPanicModeActive(guild.id)) {
      return interaction.reply({ content: 'Panic Mode đang tắt hoặc chưa được bật.', ephemeral: true });
    }
    await disablePanicMode(guild, interaction.user.id);
    await interaction.reply({ content: '✅ Panic Mode đã được tắt thủ công.', ephemeral: true });
  }
};

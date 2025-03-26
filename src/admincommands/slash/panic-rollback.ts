// src/admincommands/slash/panic-rollback.ts

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { rollbackPanic, isPanicModeActive } from '../../automod/panicMode';

export const panicRollbackCommand = {
  data: new SlashCommandBuilder()
    .setName('panic-rollback')
    .setDescription('Rollback server về snapshot trước khi Panic Mode.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: 'Lệnh này chỉ dùng trong server.', ephemeral: true });
    }

    if (!isPanicModeActive(guild.id)) {
      return interaction.reply({ content: 'Panic Mode chưa được kích hoạt hoặc đã tắt.', ephemeral: true });
    }

    await rollbackPanic(guild);
    await interaction.reply({ content: '✅ Đã rollback server về snapshot trước Panic Mode.', ephemeral: true });
  }
};

// src/admincommands/slash/panic.ts

import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits
  } from 'discord.js';
  import {
    enablePanicMode,
    disablePanicMode,
    isPanicModeActive
  } from '../../automod/panicMode';
  
  export const panic = {
    data: new SlashCommandBuilder()
      .setName('panic')
      .setDescription('Bật/tắt chế độ Panic Mode hoặc kiểm tra trạng thái')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((sub) =>
        sub.setName('on').setDescription('Bật Panic Mode (khẩn cấp)')
      )
      .addSubcommand((sub) =>
        sub.setName('off').setDescription('Tắt Panic Mode')
      )
      .addSubcommand((sub) =>
        sub.setName('status').setDescription('Kiểm tra trạng thái Panic Mode')
      ),
  
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) {
        return interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
      }
  
      const sub = interaction.options.getSubcommand();
      await interaction.deferReply({ ephemeral: true });
  
      if (sub === 'on') {
        await enablePanicMode(guild, interaction.user.id);
        await interaction.editReply(
          '🚨 **Panic Mode đã được bật!** Tất cả thành viên đã bị cách ly và backup đã được khôi phục.'
        );
      } else if (sub === 'off') {
        await disablePanicMode(guild, interaction.user.id);
        await interaction.editReply('✅ **Panic Mode đã được tắt.** Server trở lại trạng thái bình thường.');
      } else if (sub === 'status') {
        const isActive = isPanicModeActive(guild.id);
        await interaction.editReply(
          isActive
            ? '🟡 **Panic Mode đang được Bật** trên server này. Server đang trong chế độ khẩn cấp.'
            : '🟢 Panic Mode hiện KHÔNG được bật.'
        );
      }
    }
  };
  
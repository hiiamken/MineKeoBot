// src/admincommands/slash/setwelcome.ts
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField
  } from 'discord.js';
  import { setWelcomeChannel } from '../../config/config';
  
  export const setWelcomeSlashCommand = {
    data: new SlashCommandBuilder()
      .setName('setwelcome')
      .setDescription('Đặt kênh chào mừng cho server này (Admin Command - Slash)')
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('Kênh sẽ gửi tin nhắn chào mừng')
          .setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
        return;
      }
      const channel = interaction.options.getChannel('channel');
      if (!channel) {
        await interaction.reply({ content: 'Không tìm thấy kênh.', ephemeral: true });
        return;
      }
      setWelcomeChannel(interaction.guild!.id, channel.id);
      await interaction.reply({ content: `Đã đặt kênh chào mừng cho server này là <#${channel.id}>`, ephemeral: false });
    },
  };
  
// src/admincommands/slash/reload.ts

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    EmbedBuilder,
  } from 'discord.js';
  import fs from 'fs';
  import path from 'path';
  import config from '../../config/securityConfig';
  import { updateSecurityConfig } from '../../utils/updateSecurityConfig';
  
  export const reload = {
    data: new SlashCommandBuilder()
      .setName('reload')
      .setDescription('Reload lại file securityConfig.ts sang securityConfig.json')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
    async execute(interaction: ChatInputCommandInteraction) {
        const ownerId = interaction.client.application?.owner?.id || process.env.OWNER_ID;
        if (interaction.user.id !== ownerId) {
          return interaction.reply({
            content: '❌ Bạn không có quyền sử dụng lệnh này.',
            ephemeral: true,
          });
        }
  
      try {
        const jsonPath = path.resolve(process.cwd(), 'securityConfig.json');
        const data = JSON.stringify(config, null, 2);
        fs.writeFileSync(jsonPath, data);
  
        const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('🔄 Config Reloaded')
          .setDescription('securityConfig.ts đã được ghi đè sang securityConfig.json')
          .setTimestamp();
  
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        console.error('[Reload] ❌ Lỗi ghi file config:', err);
        return interaction.reply({
          content: '❌ Lỗi khi reload config.',
          ephemeral: true,
        });
      }
    },
  };
  
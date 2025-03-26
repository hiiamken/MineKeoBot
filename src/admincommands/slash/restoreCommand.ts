// src/commands/admincommands/slash/restoreCommands.ts

import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  AutocompleteInteraction, 
  EmbedBuilder 
} from 'discord.js';
import config from '../../config/securityConfig';
import { restoreFull, restorePartial } from '../../automod/restoreManager';
import { getBackupIdSuggestions } from '../../automod/backupUltis';

export const restoreCommand = {
  data: new SlashCommandBuilder()
    .setName('restore')
    .setDescription('Phục hồi dữ liệu server từ backup')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName('backup_id')
        .setDescription('ID của bản backup')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option.setName('components')
        .setDescription('Các thành phần cần phục hồi (để trống sẽ phục hồi toàn bộ)')
        .setRequired(false)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name === 'backup_id') {
      const suggestions = await getBackupIdSuggestions();
      await interaction.respond(suggestions.map(id => ({ name: id, value: id })));
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: '⚠️ Lệnh này chỉ dùng trong server.', ephemeral: true });
    }

    // Nếu cần, giới hạn chỉ Server Owner có thể phục hồi
    const owner = await guild.fetchOwner();
    if (interaction.user.id !== owner.id) {
      return interaction.reply({ content: '❌ Chỉ **Server Owner** mới có quyền phục hồi dữ liệu.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const backupId = interaction.options.getString('backup_id', true);
    const componentsStr = interaction.options.getString('components') || '';
    const components = componentsStr.trim().split(/\s+/).filter(Boolean);

    const requireApproval = config.restore?.requireApproval;

    if (components.length === 0) {
      // Restore toàn bộ
      if (requireApproval) {
        // Không khôi phục ngay, chỉ tạo yêu cầu
        await restoreFull(guild, backupId, false);
        await interaction.editReply(`🚩 Đã gửi yêu cầu phục hồi backup \`${backupId}\` cho owner để phê duyệt.`);
      } else {
        // Khôi phục luôn (force = true)
        await restoreFull(guild, backupId, true);
        await interaction.editReply(`✅ Đã phục hồi toàn bộ dữ liệu từ backup \`${backupId}\`.`);
      }
    } else {
      // Restore một phần
      if (requireApproval) {
        await restorePartial(guild, backupId, components, false);
        await interaction.editReply(`🚩 Đã gửi yêu cầu phục hồi backup \`${backupId}\` (thành phần: ${components.join(', ')}) cho owner để phê duyệt.`);
      } else {
        await restorePartial(guild, backupId, components, true);
        await interaction.editReply(`✅ Đã phục hồi các thành phần: ${components.join(', ')} từ backup \`${backupId}\`.`);
      }
    }
  }
};

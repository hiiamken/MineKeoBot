// src/commands/admincommands/slash/restore-list.ts

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPendingRestoreRequests } from '../../automod/restoreManager';

export const data = new SlashCommandBuilder()
  .setName('restore-list')
  .setDescription('📋 Xem danh sách các yêu cầu khôi phục đang chờ phê duyệt');

export async function execute(interaction: any) {
  const requests = getPendingRestoreRequests();

  if (!requests.length) {
    await interaction.reply({
      content: '✅ Không có yêu cầu khôi phục nào đang chờ duyệt.',
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('Yellow')
    .setTitle('📋 Danh sách yêu cầu khôi phục đang chờ duyệt')
    .setTimestamp();

  for (const [i, r] of requests.entries()) {
    const typeText = r.type === 'partial' ? `Partial (${r.components?.join(', ')})` : 'Full';
    embed.addFields({
      name: `#${i + 1} • Guild: ${r.guildId}`,
      value: `• Backup: \`${r.backupId}\`\n• Type: \`${typeText}\`\n• Requested: <t:${Math.floor(r.requestedAt / 1000)}:R>`
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

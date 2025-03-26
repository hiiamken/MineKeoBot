import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  AutocompleteInteraction
} from 'discord.js';
import { compareSnapshot } from '../../automod/restoreManager';
import { getBackupIds } from '../../utils/getBackupIds';

export const snapshotCompare = {
  data: new SlashCommandBuilder()
    .setName('snapshot-compare')
    .setDescription('So sánh trạng thái server với một bản backup.')
    .addStringOption(option =>
      option
        .setName('backupid')
        .setDescription('Chọn backup ID để so sánh')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption(option =>
      option
        .setName('details')
        .setDescription('Hiển thị chi tiết thay đổi hay không?')
        .setRequired(false)
    ),

    async autocomplete(interaction: AutocompleteInteraction) {
      const focusedValue = interaction.options.getFocused();
      // Gọi hàm getBackupIds tương tự /backup load
      const backupIds = await getBackupIds(interaction.guildId!);
  
      // Lọc theo người dùng gõ
      const filtered = backupIds
        .filter(id => id.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25)
        .map(id => ({ name: id, value: id }));
  
      await interaction.respond(filtered);
    },

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const backupId = interaction.options.getString('backupid', true);
    const showDetails = interaction.options.getBoolean('details') ?? false;
  
    await interaction.deferReply({ ephemeral: true });
  
    try {
      const embeds = await compareSnapshot(guild, backupId, showDetails);
      await interaction.editReply({ embeds });
    } catch (error) {
      console.error('[Snapshot Compare] Error:', error);
      await interaction.editReply({ content: '❌ Lỗi khi so sánh snapshot.' });
    }
  }
};

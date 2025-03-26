import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';
import {
  getPendingRestoreRequests,
  removeRestoreRequest,
  restoreFull,
  restorePartial
} from '../../automod/restoreManager';

export const restoreApproveCommand = {
  data: new SlashCommandBuilder()
    .setName('restore-approve')
    .setDescription('Phê duyệt hoặc từ chối một yêu cầu khôi phục dữ liệu')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('backup_id')
        .setDescription('ID của bản backup')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Phê duyệt hay từ chối')
        .setRequired(true)
        .addChoices(
          { name: 'approve', value: 'approve' },
          { name: 'deny', value: 'deny' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // 1) Defer sớm để tránh "Unknown interaction"
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply({
        content: 'Lỗi: Không tìm thấy guild.'
      });
    }

    const backupId = interaction.options.getString('backup_id', true);
    const action = interaction.options.getString('action', true);

    const pendingRequests = getPendingRestoreRequests();
    const requestIndex = pendingRequests.findIndex(
      (req) => req.guildId === guild.id && req.backupId === backupId
    );

    if (requestIndex === -1) {
      return interaction.editReply({
        content: '❌ Không tìm thấy yêu cầu khôi phục này.'
      });
    }

    const request = pendingRequests[requestIndex];

    if (action === 'deny') {
      removeRestoreRequest(requestIndex);
      return interaction.editReply({
        content: '🚫 Đã từ chối yêu cầu khôi phục.'
      });
    }

    // Approve
    try {
      if (request.type === 'full') {
        await restoreFull(guild, backupId, true);
      } else if (request.type === 'partial') {
        await restorePartial(guild, backupId, request.components || [], true);
      }

      removeRestoreRequest(requestIndex);
      await interaction.editReply({
        content: '✅ Đã phê duyệt và khôi phục dữ liệu thành công.'
      });
    } catch (error) {
      console.error('Lỗi khi khôi phục:', error);
      await interaction.editReply({
        content: '❌ Đã xảy ra lỗi khi khôi phục dữ liệu.'
      });
    }
  },
};

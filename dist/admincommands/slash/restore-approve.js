"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreApproveCommand = void 0;
const discord_js_1 = require("discord.js");
const restoreManager_1 = require("../../automod/restoreManager");
exports.restoreApproveCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('restore-approve')
        .setDescription('Phê duyệt hoặc từ chối một yêu cầu khôi phục dữ liệu')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(opt => opt.setName('backup_id')
        .setDescription('ID của bản backup')
        .setRequired(true))
        .addStringOption(opt => opt.setName('action')
        .setDescription('Phê duyệt hay từ chối')
        .setRequired(true)
        .addChoices({ name: 'approve', value: 'approve' }, { name: 'deny', value: 'deny' })),
    async execute(interaction) {
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
        const pendingRequests = (0, restoreManager_1.getPendingRestoreRequests)();
        const requestIndex = pendingRequests.findIndex((req) => req.guildId === guild.id && req.backupId === backupId);
        if (requestIndex === -1) {
            return interaction.editReply({
                content: '❌ Không tìm thấy yêu cầu khôi phục này.'
            });
        }
        const request = pendingRequests[requestIndex];
        if (action === 'deny') {
            (0, restoreManager_1.removeRestoreRequest)(requestIndex);
            return interaction.editReply({
                content: '🚫 Đã từ chối yêu cầu khôi phục.'
            });
        }
        // Approve
        try {
            if (request.type === 'full') {
                await (0, restoreManager_1.restoreFull)(guild, backupId, true);
            }
            else if (request.type === 'partial') {
                await (0, restoreManager_1.restorePartial)(guild, backupId, request.components || [], true);
            }
            (0, restoreManager_1.removeRestoreRequest)(requestIndex);
            await interaction.editReply({
                content: '✅ Đã phê duyệt và khôi phục dữ liệu thành công.'
            });
        }
        catch (error) {
            console.error('Lỗi khi khôi phục:', error);
            await interaction.editReply({
                content: '❌ Đã xảy ra lỗi khi khôi phục dữ liệu.'
            });
        }
    },
};

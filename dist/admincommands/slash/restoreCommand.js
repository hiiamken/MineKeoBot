"use strict";
// src/commands/admincommands/slash/restoreCommands.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreCommand = void 0;
const discord_js_1 = require("discord.js");
const securityConfig_1 = __importDefault(require("../../config/securityConfig"));
const restoreManager_1 = require("../../automod/restoreManager");
const backupUltis_1 = require("../../automod/backupUltis");
exports.restoreCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('restore')
        .setDescription('Phục hồi dữ liệu server từ backup')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option.setName('backup_id')
        .setDescription('ID của bản backup')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption((option) => option.setName('components')
        .setDescription('Các thành phần cần phục hồi (để trống sẽ phục hồi toàn bộ)')
        .setRequired(false)),
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'backup_id') {
            const suggestions = await (0, backupUltis_1.getBackupIdSuggestions)();
            await interaction.respond(suggestions.map(id => ({ name: id, value: id })));
        }
    },
    async execute(interaction) {
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
        const requireApproval = securityConfig_1.default.restore?.requireApproval;
        if (components.length === 0) {
            // Restore toàn bộ
            if (requireApproval) {
                // Không khôi phục ngay, chỉ tạo yêu cầu
                await (0, restoreManager_1.restoreFull)(guild, backupId, false);
                await interaction.editReply(`🚩 Đã gửi yêu cầu phục hồi backup \`${backupId}\` cho owner để phê duyệt.`);
            }
            else {
                // Khôi phục luôn (force = true)
                await (0, restoreManager_1.restoreFull)(guild, backupId, true);
                await interaction.editReply(`✅ Đã phục hồi toàn bộ dữ liệu từ backup \`${backupId}\`.`);
            }
        }
        else {
            // Restore một phần
            if (requireApproval) {
                await (0, restoreManager_1.restorePartial)(guild, backupId, components, false);
                await interaction.editReply(`🚩 Đã gửi yêu cầu phục hồi backup \`${backupId}\` (thành phần: ${components.join(', ')}) cho owner để phê duyệt.`);
            }
            else {
                await (0, restoreManager_1.restorePartial)(guild, backupId, components, true);
                await interaction.editReply(`✅ Đã phục hồi các thành phần: ${components.join(', ')} từ backup \`${backupId}\`.`);
            }
        }
    }
};

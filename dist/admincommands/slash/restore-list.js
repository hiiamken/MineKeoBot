"use strict";
// src/commands/admincommands/slash/restore-list.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const restoreManager_1 = require("../../automod/restoreManager");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('restore-list')
    .setDescription('📋 Xem danh sách các yêu cầu khôi phục đang chờ phê duyệt');
async function execute(interaction) {
    const requests = (0, restoreManager_1.getPendingRestoreRequests)();
    if (!requests.length) {
        await interaction.reply({
            content: '✅ Không có yêu cầu khôi phục nào đang chờ duyệt.',
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
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

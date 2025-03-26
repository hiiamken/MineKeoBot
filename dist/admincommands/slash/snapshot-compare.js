"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotCompare = void 0;
const discord_js_1 = require("discord.js");
const restoreManager_1 = require("../../automod/restoreManager");
const getBackupIds_1 = require("../../utils/getBackupIds");
exports.snapshotCompare = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('snapshot-compare')
        .setDescription('So sánh trạng thái server với một bản backup.')
        .addStringOption(option => option
        .setName('backupid')
        .setDescription('Chọn backup ID để so sánh')
        .setRequired(true)
        .setAutocomplete(true))
        .addBooleanOption(option => option
        .setName('details')
        .setDescription('Hiển thị chi tiết thay đổi hay không?')
        .setRequired(false)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        // Gọi hàm getBackupIds tương tự /backup load
        const backupIds = await (0, getBackupIds_1.getBackupIds)(interaction.guildId);
        // Lọc theo người dùng gõ
        const filtered = backupIds
            .filter(id => id.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25)
            .map(id => ({ name: id, value: id }));
        await interaction.respond(filtered);
    },
    async execute(interaction) {
        const guild = interaction.guild;
        const backupId = interaction.options.getString('backupid', true);
        const showDetails = interaction.options.getBoolean('details') ?? false;
        await interaction.deferReply({ ephemeral: true });
        try {
            const embeds = await (0, restoreManager_1.compareSnapshot)(guild, backupId, showDetails);
            await interaction.editReply({ embeds });
        }
        catch (error) {
            console.error('[Snapshot Compare] Error:', error);
            await interaction.editReply({ content: '❌ Lỗi khi so sánh snapshot.' });
        }
    }
};

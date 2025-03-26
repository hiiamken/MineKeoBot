"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoroleCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
exports.autoroleCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setautorole')
        .setDescription('Thiết lập role tự động cho người tham gia mới.')
        .addStringOption(option => option
        .setName('role_id')
        .setDescription('ID của role sẽ được gán tự động cho thành viên mới.')
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Lệnh này chỉ dùng trong server!', ephemeral: true });
        }
        const roleId = interaction.options.getString('role_id', true);
        // Lưu roleId vào config hoặc database (ví dụ: file config hoặc bảng config)
        await (0, config_1.setAutorole)(interaction.guild.id, roleId);
        return interaction.reply({ content: `✅ Đã cập nhật autorole thành công với role ID: ${roleId}`, ephemeral: true });
    }
};

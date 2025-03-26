"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrefixCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
exports.setPrefixCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('🔧 Thay đổi prefix của bot trong server.')
        .addStringOption(option => option.setName('prefix')
        .setDescription('Prefix mới cho bot (ví dụ: ! hoặc -)')
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Kiểm tra quyền admin
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '🚫 Bạn cần quyền **Quản trị viên** để thay đổi prefix.', ephemeral: true });
        }
        const newPrefix = interaction.options.getString('prefix', true);
        (0, config_1.setPrefix)(newPrefix);
        return interaction.reply({ content: `✅ Prefix đã được cập nhật thành **\`${newPrefix}\`**`, ephemeral: false });
    },
};
exports.default = exports.setPrefixCommand;

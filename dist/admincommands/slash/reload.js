"use strict";
// src/admincommands/slash/reload.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reload = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const securityConfig_1 = __importDefault(require("../../config/securityConfig"));
exports.reload = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload lại file securityConfig.ts sang securityConfig.json')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const ownerId = interaction.client.application?.owner?.id || process.env.OWNER_ID;
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: '❌ Bạn không có quyền sử dụng lệnh này.',
                ephemeral: true,
            });
        }
        try {
            const jsonPath = path_1.default.resolve(process.cwd(), 'securityConfig.json');
            const data = JSON.stringify(securityConfig_1.default, null, 2);
            fs_1.default.writeFileSync(jsonPath, data);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('Green')
                .setTitle('🔄 Config Reloaded')
                .setDescription('securityConfig.ts đã được ghi đè sang securityConfig.json')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        catch (err) {
            console.error('[Reload] ❌ Lỗi ghi file config:', err);
            return interaction.reply({
                content: '❌ Lỗi khi reload config.',
                ephemeral: true,
            });
        }
    },
};

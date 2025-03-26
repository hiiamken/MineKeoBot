"use strict";
// src/admincommands/slash/panic-rollback.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.panicRollbackCommand = void 0;
const discord_js_1 = require("discord.js");
const panicMode_1 = require("../../automod/panicMode");
exports.panicRollbackCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('panic-rollback')
        .setDescription('Rollback server về snapshot trước khi Panic Mode.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({ content: 'Lệnh này chỉ dùng trong server.', ephemeral: true });
        }
        if (!(0, panicMode_1.isPanicModeActive)(guild.id)) {
            return interaction.reply({ content: 'Panic Mode chưa được kích hoạt hoặc đã tắt.', ephemeral: true });
        }
        await (0, panicMode_1.rollbackPanic)(guild);
        await interaction.reply({ content: '✅ Đã rollback server về snapshot trước Panic Mode.', ephemeral: true });
    }
};

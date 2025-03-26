"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panicOverrideCommand = void 0;
// src/admincommands/slash/panic-override.ts
const discord_js_1 = require("discord.js");
const panicMode_1 = require("../../automod/panicMode");
exports.panicOverrideCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('panic-override')
        .setDescription('Tắt Panic Mode thủ công nếu bạn biết là false positive.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild)
            return interaction.reply({ content: 'Chỉ dùng trong server.', ephemeral: true });
        if (!(0, panicMode_1.isPanicModeActive)(guild.id)) {
            return interaction.reply({ content: 'Panic Mode đang tắt hoặc chưa được bật.', ephemeral: true });
        }
        await (0, panicMode_1.disablePanicMode)(guild, interaction.user.id);
        await interaction.reply({ content: '✅ Panic Mode đã được tắt thủ công.', ephemeral: true });
    }
};

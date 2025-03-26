"use strict";
// src/admincommands/slash/panic.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.panic = void 0;
const discord_js_1 = require("discord.js");
const panicMode_1 = require("../../automod/panicMode");
exports.panic = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('panic')
        .setDescription('Bật/tắt chế độ Panic Mode hoặc kiểm tra trạng thái')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub.setName('on').setDescription('Bật Panic Mode (khẩn cấp)'))
        .addSubcommand((sub) => sub.setName('off').setDescription('Tắt Panic Mode'))
        .addSubcommand((sub) => sub.setName('status').setDescription('Kiểm tra trạng thái Panic Mode')),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        if (sub === 'on') {
            await (0, panicMode_1.enablePanicMode)(guild, interaction.user.id);
            await interaction.editReply('🚨 **Panic Mode đã được bật!** Tất cả thành viên đã bị cách ly và backup đã được khôi phục.');
        }
        else if (sub === 'off') {
            await (0, panicMode_1.disablePanicMode)(guild, interaction.user.id);
            await interaction.editReply('✅ **Panic Mode đã được tắt.** Server trở lại trạng thái bình thường.');
        }
        else if (sub === 'status') {
            const isActive = (0, panicMode_1.isPanicModeActive)(guild.id);
            await interaction.editReply(isActive
                ? '🟡 **Panic Mode đang được Bật** trên server này. Server đang trong chế độ khẩn cấp.'
                : '🟢 Panic Mode hiện KHÔNG được bật.');
        }
    }
};

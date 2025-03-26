"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWelcomeSlashCommand = void 0;
// src/admincommands/slash/setwelcome.ts
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
exports.setWelcomeSlashCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Đặt kênh chào mừng cho server này (Admin Command - Slash)')
        .addChannelOption(option => option.setName('channel')
        .setDescription('Kênh sẽ gửi tin nhắn chào mừng')
        .setRequired(true)),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
            return;
        }
        const channel = interaction.options.getChannel('channel');
        if (!channel) {
            await interaction.reply({ content: 'Không tìm thấy kênh.', ephemeral: true });
            return;
        }
        (0, config_1.setWelcomeChannel)(interaction.guild.id, channel.id);
        await interaction.reply({ content: `Đã đặt kênh chào mừng cho server này là <#${channel.id}>`, ephemeral: false });
    },
};

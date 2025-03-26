"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWelcomeCommand = void 0;
// src/admincommands/prefix/setwelcome.ts
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
// ↑ prefix => admincommands => (..)
// ↑ admincommands => src => (..)
// => ../../config/config
exports.setWelcomeCommand = {
    name: 'setwelcome',
    description: 'Đặt kênh chào mừng cho server này (Admin Command)',
    async execute(message, args) {
        // Kiểm tra quyền Admin
        if (!message.member?.permissions.has(discord_js_1.PermissionsBitField.Flags.Administrator)) {
            if (message.channel.isTextBased()) {
                const ch = message.channel;
                await ch.send('Bạn không có quyền sử dụng lệnh này.');
            }
            return;
        }
        if (!message.channel.isTextBased())
            return;
        const channel = message.channel;
        if (args.length === 0) {
            await channel.send('Vui lòng tag kênh hoặc cung cấp ID kênh. Ví dụ: `!setwelcome #welcome`');
            return;
        }
        let channelId = args[0];
        const match = channelId.match(/^<#(\d+)>$/);
        if (match) {
            channelId = match[1];
        }
        (0, config_1.setWelcomeChannel)(message.guild.id, channelId);
        await channel.send(`Đã đặt kênh chào mừng cho server này là <#${channelId}>`);
    },
};

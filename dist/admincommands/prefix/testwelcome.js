"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testWelcomeCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const welcomeUtils_1 = require("../../utils/welcomeUtils");
exports.testWelcomeCommand = {
    name: 'testwelcome',
    description: 'Xem trước tin nhắn chào mừng (Admin Command)',
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
        // Lấy ID kênh chào mừng từ config
        const welcomeChannelId = (0, config_1.getWelcomeChannel)(message.guild.id);
        if (!welcomeChannelId) {
            await channel.send('Hiện tại chưa có kênh chào mừng nào được cài đặt. Hãy dùng `!setwelcome #kênh` để thiết lập.');
            return;
        }
        // Cài đặt các ID kênh cần thiết (có thể lấy từ config nếu muốn)
        const gioithieu = '1122041534288764958';
        const nhanrole = '1106803900322951169';
        const hoidap = '1167855017848487947';
        // Xây dựng Embed welcome dựa trên message.member
        const embed = (0, welcomeUtils_1.buildFancyWelcomeEmbed)(message.member, { gioithieu, nhanrole, hoidap }, 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png');
        // Gửi Embed và thêm reaction sau khi gửi thành công
        const sentMessage = await channel.send({ embeds: [embed] });
        await sentMessage.react('<a:WelcomePink:1351498641793351691>');
        await sentMessage.react('<a:WelcomePink1:1351498659589652571>');
        await sentMessage.react('<a:welcum:1351498681521672222>');
    },
};

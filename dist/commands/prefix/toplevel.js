"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toplevelPrefixCommand = void 0;
const discord_js_1 = require("discord.js");
const levelManager_1 = require("../../levels/levelManager");
exports.toplevelPrefixCommand = {
    name: 'toplevel',
    description: 'Xem bảng xếp hạng 10 người có XP cao nhất (prefix)',
    async execute(message, args) {
        if (!message.guild)
            return;
        // Lấy top 10 user
        const topPlayers = await (0, levelManager_1.getTopPlayers)(message.guild.id, 10);
        if (topPlayers.length === 0) {
            // Không có ai
            if (message.channel.isTextBased()) {
                const ch = message.channel;
                return ch.send('Chưa có dữ liệu level cho server này!');
            }
            return;
        }
        // Mỗi dòng: [ rank ] |Level: L Xp: X - @mention
        // Rồi xuống dòng hiển thị (user_id)
        const lines = topPlayers.map((player, index) => {
            const rank = index + 1;
            return (`\`[ ${rank} ]\` **| Cấp:** \`${player.level}\` **Xp:** \`${player.xp}\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`);
        });
        // Tạo Embed
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`✨` | Leveling Leaderboard')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n')) // cách nhau 1 dòng trống
            .setTimestamp(); // không có footer
        // Gửi Embed
        if (message.channel.isTextBased()) {
            const ch = message.channel;
            await ch.send({ embeds: [embed] });
        }
    },
};

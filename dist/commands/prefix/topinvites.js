"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topinvitesPrefixCommand = void 0;
const discord_js_1 = require("discord.js");
const invites_1 = require("../../database/invites");
exports.topinvitesPrefixCommand = {
    name: 'topinvites',
    description: 'Xem bảng xếp hạng 10 người có số lần mời hợp lệ cao nhất (prefix)',
    async execute(message, args) {
        if (!message.guild)
            return;
        // Lấy top 10 người có số lần mời cao nhất
        const topInviters = await (0, invites_1.getTopInviters)(message.guild.id, 10);
        if (topInviters.length === 0) {
            if (message.channel.isTextBased()) {
                const ch = message.channel;
                return ch.send('Chưa có dữ liệu số lần mời cho server này!');
            }
            return;
        }
        // Mỗi dòng: [ rank ] | 🎟 Invites: X - @mention
        const lines = topInviters.map((player, index) => {
            const rank = index + 1;
            return (`\`[ ${rank} ]\` **| 🎟 Invites:** \`${player.invite_count}\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`);
        });
        // Tạo Embed
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`🎟` | Bảng Xếp Hạng Người Mời')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n'))
            .setTimestamp();
        // Gửi Embed
        if (message.channel.isTextBased()) {
            const ch = message.channel;
            await ch.send({ embeds: [embed] });
        }
    },
};

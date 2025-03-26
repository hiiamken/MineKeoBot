"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allLogsCommand = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../../database/database");
exports.allLogsCommand = {
    name: 'alllogs',
    description: 'Xem lịch sử vi phạm của tất cả người dùng (ban, kick, mute, unban, unmute, purge).',
    usage: '!alllogs',
    async execute(message) {
        if (!message.member?.permissions.has('Administrator')) {
            return message.channel.send('🚫 Bạn không có quyền sử dụng lệnh này.');
        }
        const infractions = await (0, database_1.getAllInfractions)();
        if (infractions.length === 0) {
            return message.channel.send('✅ Không có lịch sử vi phạm nào.');
        }
        let logs = infractions.map(inf => `**[${inf.timestamp}]** 🛑 **${inf.action.toUpperCase()}** - <@${inf.user_id}> bởi <@${inf.moderator_id}>\n📜 **Lý do:** ${inf.reason}`);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('📜 Lịch Sử Vi Phạm')
            .setDescription(logs.slice(0, 10).join('\n'))
            .setFooter({ text: `Hiển thị 10 trên tổng số ${infractions.length} vi phạm.` })
            .setTimestamp();
        await message.channel.send({ embeds: [embed] });
    },
};

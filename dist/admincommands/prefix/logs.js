"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCommand = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../../database/database");
exports.logCommand = {
    name: 'log',
    description: 'Xem lịch sử vi phạm của một người dùng (ban, kick, mute, unmute, unban, purge).',
    usage: '!log @user hoặc ID',
    async execute(message, args) {
        if (!message.member)
            return;
        // Lấy user từ mention hoặc ID
        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.channel.send('⚠ Vui lòng cung cấp ID hoặc mention người dùng.');
        }
        const user = await message.client.users.fetch(userId).catch(() => null);
        if (!user) {
            return message.channel.send('⚠ Người dùng không tồn tại.');
        }
        const infractions = await (0, database_1.getInfractions)(userId, message.guild.id);
        if (infractions.length === 0) {
            return message.channel.send(`✅ ${user.tag} không có lịch sử vi phạm nào.`);
        }
        let page = 0;
        const maxPages = Math.ceil(infractions.length / 5);
        function generateEmbed() {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle(`${user?.tag || 'Người dùng'}'s Infractions`)
                .setDescription(infractions
                .slice(page * 5, (page + 1) * 5)
                .map((inf) => `
              **[${inf.timestamp}]** → **${inf.action.toUpperCase()}** bởi <@${inf.moderator_id}>
              **Lý do:** ${inf.reason || 'Không có lý do'}`)
                .join('\n'))
                .setFooter({ text: `Trang ${page + 1} / ${maxPages}` });
            return embed;
        }
        const msg = await message.channel.send({ embeds: [generateEmbed()] });
        if (maxPages > 1) {
            await msg.react('⬅');
            await msg.react('➡');
            const collector = msg.createReactionCollector({
                filter: (reaction, user) => ['⬅', '➡'].includes(reaction.emoji.name) && user.id === message.author.id,
                time: 60000,
            });
            collector.on('collect', (reaction) => {
                if (reaction.emoji.name === '⬅' && page > 0)
                    page--;
                if (reaction.emoji.name === '➡' && page < maxPages - 1)
                    page++;
                msg.edit({ embeds: [generateEmbed()] });
                reaction.users.remove(message.author.id);
            });
        }
    },
};

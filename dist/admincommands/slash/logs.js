"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCommand = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../../database/database");
exports.logCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('log')
        .setDescription('Xem lịch sử vi phạm của một người dùng.')
        .addUserOption((option) => option.setName('user').setDescription('Người dùng cần kiểm tra lịch sử vi phạm').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        if (!user) {
            return interaction.reply({ content: '⚠ Không thể tìm thấy người dùng.', ephemeral: true });
        }
        const infractions = await (0, database_1.getInfractions)(user.id, interaction.guild.id);
        if (infractions.length === 0) {
            return interaction.reply({ content: `✅ ${user.tag} không có lịch sử vi phạm nào.`, ephemeral: true });
        }
        let page = 0;
        const maxPages = Math.ceil(infractions.length / 5);
        function generateEmbed() {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle(`${user?.tag || 'Unknown User'}'s Infractions`)
                .setDescription(infractions
                .slice(page * 5, (page + 1) * 5)
                .map((inf) => `**[${inf.timestamp}]** • **${inf.action.toUpperCase()}** bởi <@${inf.moderator_id}>\n📜 **Lý do:** ${inf.reason || 'Không có lý do'}`)
                .join('\n\n'))
                .setFooter({ text: `Trang ${page + 1} / ${maxPages}` });
            return embed;
        }
        const msg = await interaction.reply({ embeds: [generateEmbed()], fetchReply: true });
        if (maxPages > 1) {
            await msg.react('⬅️');
            await msg.react('➡️');
            const collector = msg.createReactionCollector({
                filter: (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id,
                time: 60000,
            });
            collector.on('collect', (reaction) => {
                if (reaction.emoji.name === '⬅️' && page > 0)
                    page--;
                if (reaction.emoji.name === '➡️' && page < maxPages - 1)
                    page++;
                msg.edit({ embeds: [generateEmbed()] });
                reaction.users.remove(interaction.user.id);
            });
            collector.on('end', () => msg.reactions.removeAll());
        }
    },
};

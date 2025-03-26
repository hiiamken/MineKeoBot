"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topinvitesSlashCommand = void 0;
const discord_js_1 = require("discord.js");
const invites_1 = require("../../database/invites");
exports.topinvitesSlashCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('topinvites')
        .setDescription('Xem bảng xếp hạng 10 người có số lần mời hợp lệ cao nhất (slash)'),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: 'Lệnh này chỉ có thể sử dụng trong server!', ephemeral: true });
            return;
        }
        // Lấy top 10 người có số lần mời hợp lệ cao nhất
        const topInviters = await (0, invites_1.getTopInviters)(guild.id, 10);
        if (topInviters.length === 0) {
            return interaction.reply('Chưa có dữ liệu số lần mời cho server này!');
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
        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};

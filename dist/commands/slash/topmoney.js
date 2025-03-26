"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topmoneySlashCommand = void 0;
const discord_js_1 = require("discord.js");
const economy_1 = require("../../database/economy");
exports.topmoneySlashCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('topmoney')
        .setDescription('Xem bảng xếp hạng 10 người có nhiều tiền nhất (slash)'),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: 'Lệnh này chỉ có thể sử dụng trong server!', ephemeral: true });
            return;
        }
        // Lấy top 10 người giàu nhất
        const topBalances = await (0, economy_1.getTopBalances)(guild.id, 10);
        if (topBalances.length === 0) {
            return interaction.reply('Chưa có dữ liệu tiền cho server này!');
        }
        // Mỗi dòng: [ rank ] | 💰 Money: X VNĐ - @mention
        // Xuống dòng hiển thị (user_id)
        const lines = topBalances.map((player, index) => {
            const rank = index + 1;
            return (`\`[ ${rank} ]\` **| 💰 Tiền:** \`${player.money.toLocaleString()} VNĐ\` - <@${player.user_id}>\n` +
                `(\`${player.user_id}\`)`);
        });
        // Tạo Embed
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('`💰` | Bảng Xếp Hạng Tiền')
            .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
            .setDescription(lines.join('\n\n'))
            .setTimestamp(); // không có footer
        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};

// commands/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Levels = require("discord.js-leveling");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankxp')
        .setDescription('Hiển thị bảng xếp hạng kinh nghiệm.'),
    async execute(interaction, client) {
        const { guildId } = interaction;

        const rawLeaderboard = await Levels.fetchLeaderboard(guildId, 10);

        if (rawLeaderboard.length < 1) return interaction.reply("Bảng xếp hạng đang trống.");

        const embed = new EmbedBuilder();
        const leaderboard = await Levels.computeLeaderboard(client, rawLeaderboard, true);

        const lb = leaderboard.map((e, index) => {
            let medalEmoji = "";
            if (index === 0) {
                medalEmoji = "🥇";
            } else if (index === 1) {
                medalEmoji = "🥈";
            } else if (index === 2) {
                medalEmoji = "🥉";
            }

            return `#${e.position} - ${e.username} - Cấp ${e.level} (XP: ${e.xp.toLocaleString()}/${Levels.xpFor(e.level + 1)}) ${medalEmoji}`;
        });

        embed.setTitle("Bảng xếp hạng kinh nghiệm máy chủ")
            .setDescription(lb.join("\n"))
            .setColor(0xecb2fb)
            .setTimestamp()
            .setFooter({
                text: "Dữ liệu sẽ tự động cập nhật mỗi 1 phút",
                iconURL:
                  "https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1",
              });

        return interaction.reply({ embeds: [embed] });
    },
};

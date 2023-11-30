const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const Ranking = require("../../Models/Ranking");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankcounting')
        .setDescription('Hiển thị bảng xếp hạng người chơi counting.'),

    async execute(interaction) {
        try {
            // Check if the interaction has already been replied to or deferred
            if (!interaction.deferred && !interaction.replied) {
                // Defer the reply
                await interaction.deferReply();

                // Gọi hàm cập nhật dữ liệu
                await updateRankings(interaction);
            }
        } catch (err) {
            console.error(err);

            const errEmbed = new EmbedBuilder()
                .setDescription(`Không thể lấy danh sách người chơi.`)
                .setColor(0xECB2FB);

            // Use interaction.followUp() for ephemeral replies after initial defer
            await interaction.followUp({ embeds: [errEmbed], ephemeral: true });
        }
    },
};

// Hàm cập nhật dữ liệu
async function updateRankings(interaction) {
    const guildMembers = await interaction.guild.members.fetch();
    const rankings = await Ranking.find().sort({ correctCount: -1 }).limit(10);

    const embed = new EmbedBuilder()
        .setTitle("Bảng xếp hạng người chơi đếm đúng nhiều nhất")
        .setColor(0xECB2FB)
        .setTimestamp()
        .setFooter({ text: 'Dữ liệu sẽ tự động cập nhật mỗi 5 phút', iconURL: 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1' });

    let description = "";

    rankings.forEach((user, index) => {
        const member = guildMembers.get(user.userId);

        const placeEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        description += `#${index + 1} - ${member ? member.displayName : user.userId} - ${user.correctCount} lần đếm đúng ${placeEmoji}\n`;
    });

    embed.setDescription(description);

    try {
        // Use interaction.followUp() for ephemeral replies
        await interaction.followUp({
            embeds: [embed],
            ephemeral: true,
        });

        // Schedule the next update after 5 minutes
        setTimeout(() => updateRankings(interaction), 5 * 60 * 1000);
    } catch (error) {
        console.error(error);
    }
}

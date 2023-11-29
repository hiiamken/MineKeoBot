const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const Ranking = require("../../Models/Ranking");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankcounting')
        .setDescription('Hiển thị bảng xếp hạng người chơi counting.'),
        
    async execute(interaction) {
            const rankings = await Ranking.find().sort({ correctCount: -1 }).limit(10);
    
            const embed = new EmbedBuilder()
                .setDescription("Bảng xếp hạng trò chơi đếm số")
                .setColor(0xECB2FB)
                .setTimestamp();
    
            rankings.forEach((user, index) => {
                embed.addFields(
                    { name: `${index + 1}. <${user.userId}>`, value: `Số lần đúng: ${user.correctCount}`}
                );
            });
    
            await interaction.reply({
                embeds: [embed]
            });
        },
};

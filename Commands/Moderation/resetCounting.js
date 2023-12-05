const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Ranking = require("../../Models/Ranking");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resetcounting")
        .setDescription("Reset điểm số của người chơi.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName("player")
                .setDescription("Người chơi muốn reset điểm số.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const { options } = interaction;

        // Lấy thông tin người chơi từ option
        const targetPlayer = options.getUser("player");

        try {
            // Tìm và cập nhật dữ liệu của người chơi trong mô hình Ranking
            const userRanking = await Ranking.findOne({ userId: targetPlayer.id });

            if (userRanking) {
                userRanking.correctCount = 0;
                await userRanking.save();
                interaction.reply(`Điểm số của ${targetPlayer.username} đã được reset thành 0.`);
            } else {
                interaction.reply(`Không tìm thấy dữ liệu điểm số cho ${targetPlayer.username}.`);
            }
        } catch (error) {
            console.error(error);
            interaction.reply('Đã xảy ra lỗi khi thực hiện reset điểm số.');
        }
    },
};

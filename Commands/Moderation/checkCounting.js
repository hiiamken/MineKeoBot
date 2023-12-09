const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Ranking = require("../../Models/Ranking");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkcounting")
    .setDescription("Kiểm tra điểm số của người chơi.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription("Người chơi muốn kiểm tra điểm số.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const { options } = interaction;

    // Lấy thông tin người chơi từ option
    const targetPlayer = options.getUser("player");

    try {
      // Tìm dữ liệu của người chơi trong mô hình Ranking
      const userRanking = await Ranking.findOne({ userId: targetPlayer.id });

      if (userRanking) {
        interaction.reply(
          `${targetPlayer.username} có điểm số là: ${userRanking.correctCount}`
        );
      } else {
        interaction.reply(
          `Không tìm thấy dữ liệu điểm số cho ${targetPlayer.username}.`
        );
      }
    } catch (error) {
      console.error(error);
      interaction.reply("Đã xảy ra lỗi khi thực hiện kiểm tra điểm số.");
    }
  },
};

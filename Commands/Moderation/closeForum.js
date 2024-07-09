const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Đóng bài viết"),
  async execute(interaction) {
    const allowedChannels = ["1194438124990910585", "1194439616359571527", "1194441092263854110"];
    if (!allowedChannels.includes(interaction.channel.id)) {
      await interaction.reply({
        content: "Lệnh này chỉ có thể được sử dụng trong các kênh cụ thể.",
        ephemeral: true,
      });
      return;
    }

    if (
      interaction.channel.isThread() &&
      (interaction.user.id === interaction.channel.ownerId ||
        interaction.member.roles.cache.has("1180041593928032306"))
    ) {
      if (interaction.channel.archived) {
        await interaction.reply({
          content: "Chủ đề này đã được lưu trữ.",
          ephemeral: true,
        });
      } else {
        const embed = new EmbedBuilder()
          .setDescription(`${interaction.user} đang đóng chủ đề`)
          .setColor(0xcf8ed9);

        await interaction.channel.send({ embeds: [embed] });

        setTimeout(async () => {
          await interaction.channel.setLocked(true);
          await interaction.channel.setArchived(true);
        }, 1000);
      }
    } else {
      await interaction.reply({
        content: "Bạn không có quyền đóng chủ đề này.",
        ephemeral: true,
      });
    }
  },
};
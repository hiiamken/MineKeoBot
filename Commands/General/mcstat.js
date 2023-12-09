const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mcstats")
    .setDescription("Kiểm tra thông tin máy chủ Minecraft")
    .addStringOption((option) =>
      option.setName("ip").setDescription("Địa chỉ IP và port của máy chủ").setRequired(true)
    ),
  async execute(interaction) {
    try {
      if (!interaction.isCommand()) {
        console.error('Invalid interaction type.');
        return;
      }

      const ipWithPort = interaction.options.getString("ip");
      const [javaData, bedrockData] = await Promise.all([
        fetch(`https://api.mcsrvstat.us/3/${ipWithPort}`).then((res) => res.json()),
        fetch(`https://api.mcsrvstat.us/bedrock/3/${ipWithPort}`).then((res) => res.json())
      ]);

      const embed = new EmbedBuilder().setColor(0xecb2fb);

      if (javaData.online) {
        // Hiển thị IP và port trong giá trị
        embed.addFields(
          { name: 'IP', value: `${javaData.ip}(${javaData.port})` },
          { name: 'Tên miền', value: javaData.hostname },
          { name: 'Phiên bản (Java)', value: javaData.version || "Không có" },
          { name: 'Phiên bản (Bedrock)', value: bedrockData.online ? bedrockData.version : "Không có" },
          { name: 'Số người chơi', value: `${javaData.players.online}/${javaData.players.max}` }
        );

        // Thêm biểu tượng (icon) vào embed
        const iconUrl = `https://api.mcsrvstat.us/icon/${ipWithPort}`;
        embed.setThumbnail(iconUrl);
      } else {
        embed.setDescription(`⚽ \`${ipWithPort}\` đang **ngoại tuyến** hoặc không tồn tại`);
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error processing command:", error);
      await interaction.reply({
        content: "Có lỗi xảy ra khi xử lý lệnh.",
        ephemeral: true,
      });
    }
  },
};
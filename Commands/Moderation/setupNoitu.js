const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const countingScheme = require("../../Models/Noitu"); // Thay đổi mô hình dữ liệu

let playerStates = {};
let usedWords = {}; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName("noitu") 
    .setDescription("Minigame nối từ.")   
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setDescription("Setup kênh nối từ.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Kênh muốn đặt nối từ.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("reset").setDescription("Reset trò chơi nối từ.")
    ),

  async execute(interaction) {
    const { options, guildId, guild, member } = interaction;
    const isAdmin = member.roles.cache.has('1178278042053910558');

    const subcommand = options.getSubcommand();

    const channel = options.getChannel("channel");

    const errEmbed = new EmbedBuilder()
      .setDescription("Lỗi rồi!")
      .setColor(0xecb2fb)
      .setTimestamp();

    switch (subcommand) {
      case "setup":
        if (!isAdmin) {
          return interaction.reply({
            content: "Bạn không có quyền sử dụng lệnh này.",
            ephemeral: true,
          });
        }
        countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
          if (!data) {
            await countingScheme.create({
              GuildID: guildId,
              Channel: channel.id,
              Count: 1,
              LastPerson: "",
              IsNumberEntered: false,
            });
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    `Setup nối từ thành công tại kênh ${channel}.\nHãy nhắn từ tiếng Anh đầu tiên để bắt đầu!`
                  )
                  .setColor(0xecb2fb)
                  .setTimestamp(),
              ],
              ephemeral: false,
            });
          } else if (data) {
            data.Channel = channel.id;
            data.save();

            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    `Thay dữ liệu kênh nối từ cũ bằng kênh ${channel}.`
                  )
                  .setColor(0xecb2fb)
                  .setTimestamp(),
              ],
              ephemeral: false,
            });
          }
          if (err) {
            return interaction.reply({
              embeds: [errEmbed],
              ephemeral: true,
            });
          }
        });
        break;
      case "reset":
        if (!isAdmin) {
          return interaction.reply({
            content: "Bạn không có quyền sử dụng lệnh này.",
            ephemeral: true,
          });
        }
        const resetData = await countingScheme.findOne({ GuildID: guildId });
        if (resetData) {
          resetData.UserWords = new Map(); 
          await resetData.save();

          playerStates = {};
          usedWords = {};

          return interaction.reply({
            content: `Đã reset trò chơi nối từ. Người chơi tiếp theo có thể nhập bất kì từ tiếng Anh nào để bắt đầu.`,
            ephemeral: false,
          });
        } else {
          return interaction.reply({
            content: "Không tìm thấy dữ liệu trò chơi để reset.",
            ephemeral: true,
          });
        }
        break;
    }
  },
};
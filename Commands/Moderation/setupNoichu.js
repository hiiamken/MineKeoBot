const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const countingScheme = require("../../Models/Noichu");

// Di chuyển playerStates ra ngoài hàm execute để nó trở thành biến toàn cục
let playerStates = {};
let usedWords = {}; // Biến toàn cục để lưu trữ từ đã sử dụng

module.exports = {
  data: new SlashCommandBuilder()
    .setName("noichu")
    .setDescription("Minigame nối chữ.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setDescription("Setup kênh nối chữ.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Kênh muốn đặt nối chữ.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mute")
        .setDescription("Mute một người khỏi kênh")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người muốn mute")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unmute")
        .setDescription("Unmute một người trong kênh")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người chơi muốn unmute")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("reset").setDescription("Reset trò chơi nối chữ.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Liệt kê các từ đã được sử dụng.")
    ),

  async execute(interaction) {
    const { options, guildId, guild, member } = interaction;
    const isAdmin = member.roles.cache.has('1178278042053910558');

    const subcommand = options.getSubcommand();

    const channel = options.getChannel("channel");
    const user = options.getUser("user");

    const errEmbed = new EmbedBuilder()
      .setDescription("Lỗi rồi!")
      .setColor(0xecb2fb)
      .setTimestamp();

    switch (subcommand) {
      case "setup":
        // Chỉ cần thành viên có thể sử dụng
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
                    `Setup nối chữ thành công tại kênh ${channel}.\nHãy nhắn từ tiếng Anh đầu tiên để bắt đầu!`
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
                    `Thay dữ liệu kênh nối chữ cũ bằng kênh ${channel}.`
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
      case "mute":
        // Chỉ cần thành viên có thể sử dụng
        if (!isAdmin) {
          return interaction.reply({
            content: "Bạn không có quyền sử dụng lệnh này.",
            ephemeral: true,
          });
        }
        countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
          if (!data) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Bạn cần setup kênh nối chữ trước.`)
                  .setColor(0xecb2fb)
                  .setTimestamp(),
              ],
              ephemeral: true,
            });
          } else if (data) {
            const ch = guild.channels.cache.get(data.Channel);

            ch.PermissionFlagsBits.edit(user.id, { SendMessages: false });

            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setFooter({
                    text: `${member.user.tag}`,
                    iconURL: member.displayAvatarURL(),
                  })
                  .setDescription(`Bạn đã mute thành công ${user}.`)
                  .setColor(0xecb2fb)
                  .setTimestamp(),
              ],
              ephemeral: true,
            });
          }
          if (err) {
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });
          }
        });
        break;
      case "unmute":
        // Chỉ cần thành viên có thể sử dụng
        if (!isAdmin) {
          return interaction.reply({
            content: "Bạn không có quyền sử dụng lệnh này.",
            ephemeral: true,
          });
        }
        countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
          if (!data) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Bạn cần setup kênh nối chữ trước.`)
                  .setColor(0xecb2fb)
                  .setTimestamp(),
              ],
              ephemeral: true,
            });
          } else if (data) {
            const ch = guild.channels.cache.get(data.Channel);

            ch.PermissionFlagsBits.edit(user.id, { SendMessages: true });

            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setFooter({
                    text: `${member.user.tag}`,
                    iconURL: member.displayAvatarURL(),
                  })
                  .setDescription(`Bạn đã unmute thành công ${user}.`)
                  .setColor(0xecb2fb)
                  .setTimestamp(),
              ],
              ephemeral: true,
            });
          }
          if (err) {
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });
          }
        });
        break;
      case "reset":
        // Chỉ cần thành viên có thể sử dụng
        if (!isAdmin) {
          return interaction.reply({
            content: "Bạn không có quyền sử dụng lệnh này.",
            ephemeral: true,
          });
        }
        const resetData = await countingScheme.findOne({ GuildID: guildId });
        if (resetData) {
          // Đặt lại hoặc xóa trường UserWords
          resetData.UserWords = new Map(); // Hoặc data.UserWords.clear(); nếu bạn muốn giữ Map nhưng xóa nội dung
          await resetData.save();

          // Đặt lại trạng thái trong bộ nhớ
          playerStates = {};
          usedWords = {};

          return interaction.reply({
            content: `Đã reset trò chơi nối chữ. Người chơi tiếp theo có thể nhập bất kì từ tiếng Anh nào để bắt đầu.`,
            ephemeral: false,
          });
        } else {
          // Trường hợp không tìm thấy dữ liệu
          return interaction.reply({
            content: "Không tìm thấy dữ liệu trò chơi để reset.",
            ephemeral: true,
          });
        }
        break;
      case "list":
        const listData = await countingScheme.findOne({ GuildID: guildId });
        if (listData && listData.UserWords) {
          // Truy xuất và hiển thị UserWords như một Map
          let messageContent = "";

          // Lấy danh sách các từ và sắp xếp chúng theo thứ tự a-z
          const sortedWords = Array.from(listData.UserWords.keys()).sort();

          // Tạo messageContent từ danh sách đã sắp xếp
          sortedWords.forEach((key) => {
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            messageContent += `• ${capitalizedKey} ✔\n`;
          });

          return interaction.reply({
            content:
              messageContent.length > 0
                ? `Các từ đã sử dụng:\n${messageContent}`
                : "Chưa có từ nào được sử dụng.",
            ephemeral: true,
          });
        } else {
          // Không có từ nào
          return interaction.reply({
            content: "Chưa có từ nào được sử dụng.",
            ephemeral: true,
          });
        }
        break;
    }
  },
};

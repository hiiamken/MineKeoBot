const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription(`Lấy avatar của người dùng từ máy chủ`)
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(`Avatar của người dùng cần lấy`)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription(
          `Nếu người dùng đã rời khỏi, bạn có thể nhập ID người dùng`
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    const { client, member } = interaction;
    const userOption = interaction.options.getUser("user");
    const idOption = interaction.options.getString("id");

    let user;

    if (userOption) {
      user = userOption;
    } else if (idOption) {
      try {
        user = await client.users.fetch(idOption);
      } catch (error) {
        console.error(error);
        await interaction.reply(
          "Lỗi khi lấy thông tin người dùng. Vui lòng đảm bảo ID được cung cấp là hợp lệ."
        );
        return;
      }
    } else {
      user = member.user;
    }

    const userAvatar = user.displayAvatarURL({ size: 2048, dynamic: true });

    const embed = new EmbedBuilder()
      .setColor("#eeeeee")
      .setAuthor({
        name: `Avatar của ${user.username}`,
        iconURL: `${user.displayAvatarURL({ size: 64, dynamic: true })}`,
      })
      .setImage(userAvatar)
      .setTimestamp()
      .setFooter({ text: `ID Người dùng: ${user.id}` });

    const png = new ButtonBuilder()
      .setLabel("PNG")
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ size: 2048, format: "png" }));

    const jpg = new ButtonBuilder()
      .setLabel("JPG")
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ size: 2048, format: "jpg" }));

    const jpeg = new ButtonBuilder()
      .setLabel("JPEG")
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ size: 2048, format: "jpeg" }));

    const gif = new ButtonBuilder()
      .setLabel("GIF")
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ size: 2048, format: "gif" }));

    const row = new ActionRowBuilder().addComponents(png, jpg, jpeg, gif);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
      components: [row],
    });
  },
};

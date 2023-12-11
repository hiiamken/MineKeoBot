// commands/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Levels = require("discord.js-leveling");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Kiểm tra cấp độ và xếp hạng của ai đó")
    .addUserOption((option) =>
      option.setName("user").setDescription("Lựa chọn một người")
    ),
  async execute(interaction) {

    if (interaction.channelId !== allowedChannelId) {
      const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
      const channelMention = `<#${allowedChannel.id}>`;

      return interaction.reply({
          content: `Bạn chỉ có thể sử dụng lệnh này trong ${channelMention}.`,
          ephemeral: true,
      });
  }

    const { options, guildId, user } = interaction;

    console.log(Levels.xpFor(1));

    const member = options.getMember("user") || user;

    const levelUser = await Levels.fetch(member.id, guildId);

    const embed = new EmbedBuilder();

    if (!levelUser)
      return interaction.reply({
        content: "Người này chưa có điểm kinh nghiệm nào!",
        ephemeral: true,
      });

    const username = member?.tag ?? member?.displayName ?? user.username;
    embed
      .setDescription(
        `**${username}** hiện tại đang có cấp độ ${
          levelUser.level
        } và ${levelUser.xp.toLocaleString()} kinh nghiệm.`
      )
      .setColor("Random")
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

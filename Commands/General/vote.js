const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Xem cách link bình chọn cho máy chủ"),

  async execute(interaction) {
    const allowedChannelId = "1181147913703936021";

    if (interaction.channelId !== allowedChannelId) {
      const allowedChannel =
        interaction.guild.channels.cache.get(allowedChannelId);
      const channelMention = `<#${allowedChannel.id}>`;

      return interaction.reply({
        content: `Bạn chỉ có thể sử dụng lệnh này trong ${channelMention}.`,
        ephemeral: true,
      });
    }

    const voteLinks = {
      "Link 1": {
        url: "https://best-minecraft-servers.co/server-minekeo.16078/vote",
        site: "Best-Minecraft-Servers",
        emoji: "<:emerald:1168497260615700510>",
      },
      "Link 2": {
        url: "https://servers-minecraft.net/server-minekeo.25217",
        site: "Servers-Minecraft",
        emoji: "<:gold:1168497599712612402>",
      },
      "Link 3": {
        url: "https://topg.org/minecraft-servers/server-658387",
        site: "Topg",
        emoji: "<:ruby:1168497958946344973>",
      },
      "Link 4": {
        url: "https://minecraftpocket-servers.com/server/125199/vote/",
        site: "Minecraftpocket-Servers",
        emoji: "<:platinum:1168497904315547648>",
      },
      "Link 5": {
        url: "https://minecraft-mp.com/server/321971/vote/",
        site: "Minecraft-Mp",
        emoji: "<:bronze:1168497795330756720>",
      },
      "Link 6": {
        url: "https://minecraft-news.net/servers/minekeo/vote",
        site: "Minecraft-News",
        emoji: "<:amethyst:1168497659053625364>",
      },
      "Link 7": {
        url: "https://minecraftservers.org/vote/655363",
        site: "Minecraftservers",
        emoji: "<:sapphire:1168497725852110878>",
      },
    };

    let description = "Bạn có thể bình chọn cho máy chủ bằng cách sử dụng các đường link bên dưới đây. Sau khi bình chọn thành công, bạn sẽ nhận được các phần thưởng khi chơi ở các cụm trong MineKeo NetWork.\n\n**Link có thể bình chọn**\n";

    for (const [name, data] of Object.entries(voteLinks)) {
      description += `   ${data.emoji}[${name}](${data.url}) | ${data.site}\n`;
    }

    description += "\nBạn có thể bình chọn kể cả khi **Offline**. Phần thưởng sẽ được tính ở cụm mà bạn tham gia đầu tiên (Ngoại trừ Hub)";

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Hãy bình chọn cho MineKeo!`,
        iconURL:
          "https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1",
      })
      .setDescription(description)
      .setColor(0xecb2fb)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};

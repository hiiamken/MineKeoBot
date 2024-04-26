const {
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const linkSchema = require("../../Models/antilink");
const antilinkLogSchema = require("../../Models/antilinkLogChannel");
const ms = require("ms");

module.exports = {
  name: "messageCreate",
  async execute(msg, client) {
    if (!msg.guild) return;
    if (msg.author?.bot) return;

    // Allowed channels
    const allowedChannels = ["1181147913703936021", "1174937441556238396"];

    if (allowedChannels.includes(msg.channel.id)) {
      return;
    }
    

    let requireDB = await linkSchema.findOne({ _id: msg.guild.id });
    const data = await antilinkLogSchema.findOne({ Guild: msg.guild.id });
    if (!data || !requireDB || requireDB.logs === false) return;

    const memberPerms = data.Perms;
    const user = msg.author;
    const member = msg.guild.members.cache.get(user.id);

    if (member.permissions.has(memberPerms)) return;

    const allowedLinks = ["https://youtu.be/", "https://www.youtube.com/"];
    const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+)/gi;
    const content = msg.content.toLowerCase();

    let hasDisallowedLink =
      linkRegex.test(content) &&
      !allowedLinks.some((allowedLink) =>
        content.includes(allowedLink.toLowerCase())
      );

    if (hasDisallowedLink) {
      msg.delete();

      // Warning message
      const warningEmbed = new EmbedBuilder()
        .setDescription(
          `:warning: | Liên kết không được phép trên máy chủ này, ${user}.`
        )
        .setColor(0xecb2fb);

      msg.channel.send({ embeds: [warningEmbed] }).catch(console.error);

      // Log message
      const logChannel = client.channels.cache.get(data.logChannel);
      if (logChannel) {
        logChannel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xecb2fb)
                .setDescription(
                  `<@${user.id}> đã bị cảnh báo vì gửi link trong <#${msg.channel.id}>.\n\`\`\`${msg.content}\`\`\``
                )
                .setFooter({ text: `User ID: ${user.id}` })
                .setTimestamp(),
            ],
          })
          .catch(console.error);
      }
    }
  },
};
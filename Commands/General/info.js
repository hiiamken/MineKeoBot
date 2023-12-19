const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');

const { profileImage } = require('discord-arts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("xem thông tin của bạn hoặc một người")
    .setDMPermission(false)
    .addUserOption((option) => option
      .setName("member")
      .setDescription("Tên")
    ),
  /**
   * 
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {

    const allowedChannelId = '1181147913703936021';

        if (interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            const channelMention = `<#${allowedChannel.id}>`;

            return interaction.reply({
                content: `Bạn chỉ có thể sử dụng lệnh này trong ${channelMention}.`,
                ephemeral: true,
            });
        }
        
    await interaction.deferReply();
    const memberOption = interaction.options.getMember("member");
    const member = memberOption || interaction.member;

    if (member.user.bot) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setDescription("At this moment, the bot isn't supported for the bots.")
        ],
        ephemeral: true
      });
    }

    try {
      const fetchedMembers = await interaction.guild.members.fetch();

      const profileBuffer = await profileImage(member.id);
      const imageAttachment = new AttachmentBuilder(profileBuffer, { name: 'profile.png' });

      const joinPosition = Array.from(fetchedMembers
        .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
        .keys())
        .indexOf(member.id) + 1;

      const topRoles = member.roles.cache
        .sort((a, b) => b.position - a.position)
        .map(role => role)
        .slice(0, 3);

      const userBadges = member.user.flags.toArray();

      const joinTime = parseInt(member.joinedTimestamp / 1000);
      const createdTime = parseInt(member.user.createdTimestamp / 1000);

      const Booster = member.premiumSince ? "<:discordboost7:1186143423586123879>" : "✖";

      const avatarButton = new ButtonBuilder()
        .setLabel('Avatar')
        .setStyle(5)
        .setURL(member.displayAvatarURL());

      const row = new ActionRowBuilder()
        .addComponents(avatarButton);

      const Embed = new EmbedBuilder()
        .setAuthor({ name: `${member.user.tag} | Thông tin chung`, iconURL: member.displayAvatarURL() })
        .setColor(0xecb2fb)
        .setDescription(`Vào ngày <t:${joinTime}:D>, ${member.user.username} đã tham gia đã MineKeoNetWork và là thành viên thứ **${addSuffix(joinPosition)}** của máy chủ.`)
        .setImage("attachment://profile.png")
        .addFields([
          { name: "Huy hiệu", value: `${addBadges(userBadges).join("")}`, inline: true },
          { name: "Booster", value: `${Booster}`, inline: true },
          { name: "Vai trò", value: `${topRoles.join("").replace(`<@${interaction.guildId}>`)}`, inline: false },
          { name: "Thời gian lập nick", value: `<t:${createdTime}:R>`, inline: true },
          { name: "Thời gian tham gia", value: `<t:${joinTime}:R>`, inline: true },
          { name: "ID", value: `${member.id}`, inline: false },
        ]);

      interaction.editReply({ embeds: [Embed], components: [row], files: [imageAttachment] });

    } catch (error) {
      interaction.editReply({ content: "An error in the code" });
      throw error;
    }
  }
};

function addSuffix(number) {
  if (number % 100 >= 11 && number % 100 <= 13)
    return number + "th";

  switch (number % 10) {
    case 1: return number + "st";
    case 2: return number + "nd";
    case 3: return number + "rd";
  }
  return number + "th";
}

function addBadges(badgeNames) {
  if (!badgeNames.length) return ["X"];
  const badgeMap = {
    "ActiveDeveloper": "<:activedeveloper:1137081810656960512> ",
    "BugHunterLevel1": "<:discordbughunter1:1137081819423064175>",
    "BugHunterLevel2": "<:discordbughunter2:1137081823734800424>",
    "PremiumEarlySupporter": "<:discordearlysupporter:1137081826872139876>",
    "Partner": "<:discordpartner:1137081833612394569>",
    "Staff": "<:discordstaff:1137081836829409362>",
    "HypeSquadOnlineHouse1": "<:hypesquadbravery:1186143455219568802>", // bravery
    "HypeSquadOnlineHouse2": "<:hypesquadbrilliance:1186143458973470790>", // brilliance
    "HypeSquadOnlineHouse3": "<:hypesquadbalance:1186143452933656657>", // balance
    "Hypesquad": "<:hypesquadevents:1186143462744133713>",
    "CertifiedModerator": "<:olddiscordmod:1137081849131319336>",
    "VerifiedDeveloper": "<:discordbotdev:1137081815799169084>",
  };

  return badgeNames.map(badgeName => badgeMap[badgeName] || '❔');
}

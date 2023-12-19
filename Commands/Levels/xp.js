const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Levels = require("discord.js-leveling");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Điều chỉnh kinh nghiệm của một người.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand.setName("add")
            .setDescription("Thêm kinh nghiệm cho một người")
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("Tên người bạn muốn.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName("amount")
                    .setDescription("Số kinh nghiệm.")
                    .setMinValue(0)
                    .setRequired(true)    
            )    
    )
    .addSubcommand(subcommand =>
        subcommand.setName("remove")
            .setDescription("Rút kinh nghiệm của một người")
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("Tên người bạn muốn.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName("amount")
                    .setDescription("Số kinh nghiệm.")
                    .setMinValue(0)
                    .setRequired(true)    
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName("set")
            .setDescription("Set kinh nghiệm của một người")
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("Tên người bạn muốn.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName("amount")
                    .setDescription("Số kinh nghiệm.")
                    .setMinValue(0)
                    .setRequired(true)    
            )

    ),
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

    const { options, guildId } = interaction;

    const sub = options.getSubcommand();
    const target = options.getUser("user");
    const amount = options.getInteger("amount");
    const embed = new EmbedBuilder();

    try {
        switch (sub) {
            case "add":
                await Levels.appendXp(target.id, guildId, amount);
                embed.setDescription(`Đã thêm ${amount} kinh nghiệm cho ${target}`).setColor("Green").setTimestamp();
                break;
            case "remove":
                await Levels.subtractXp(target.id, guildId, amount);
                embed.setDescription(`Đã rút ${amount} kinh nghiệm của ${target}`).setColor("Green").setTimestamp();
                break;
            case "set":
                await Levels.setXp(target.id, guildId, amount);
                embed.setDescription(`Đã đặt ${amount} kinh nghiệm cho ${target}`).setColor("Green").setTimestamp();
                break;
        }
    } catch (err) {
        console.log(err);
    }

    interaction.reply({ embeds: [embed], ephemeral: true});
  },
};

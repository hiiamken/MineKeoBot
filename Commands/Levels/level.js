const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Levels = require("discord.js-leveling");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Điều chỉnh level của một người.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand.setName("add")
            .setDescription("Thêm level cho một người")
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
            .setDescription("Rút level của một người")
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
            .setDescription("Set level của một người")
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
                await Levels.appendLevel(target.id, guildId, amount);
                embed.setDescription(`Đã thêm ${amount} cấp độ cho ${target}`).setColor("Green").setTimestamp();
                break;
            case "remove":
                await Levels.subtractLevel(target.id, guildId, amount);
                embed.setDescription(`Đã rút ${amount} cấp độ của ${target}`).setColor("Green").setTimestamp();
                break;
            case "set":
                await Levels.setLevel(target.id, guildId, amount);
                embed.setDescription(`Đã đặt ${amount} cấp độ cho ${target}`).setColor("Green").setTimestamp();
                break;
        }
    } catch (err) {
        console.log(err);
    }

    interaction.reply({ embeds: [embed], ephemeral: true});
  },
};

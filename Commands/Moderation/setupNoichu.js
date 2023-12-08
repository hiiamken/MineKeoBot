const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const countingScheme = require("../../Models/Noichu");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("noichu")
        .setDescription("Minigame nối chữ.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand => 
            subcommand.setName("setup")
                .setDescription("Setup kênh nối chữ.")
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("Kênh muốn đặt nối chữ.")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("mute")
                .setDescription("Mute một người khỏi kênh")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Người muốn mute")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("unmute")
                .setDescription("Unmute một người trong kênh")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Người chơi muốn unmute")
                        .setRequired(true)   
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("reset")
                .setDescription("Reset trò chơi nối chữ.")
        ),

    async execute(interaction) {
        const { options, guildId, guild, member } = interaction;

        const subcommand = options.getSubcommand();

        const channel = options.getChannel("channel");
        const user = options.getUser("user");
        let playerStates = {};

        const errEmbed = new EmbedBuilder()
            .setDescription("Lỗi rồi!")
            .setColor(0xECB2FB)
            .setTimestamp();

        switch (subcommand) {
            case "setup":
                countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
                    if (!data) {
                        await countingScheme.create({
                            GuildID: guildId,
                            Channel: channel.id,
                            Count: 1,
                            LastPerson: "",
                            IsNumberEntered: false
                        });
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Setup nối chữ thành công tại kênh ${channel}.\nHãy nhắn từ tiếng Anh đầu tiên để bắt đầu!`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: false
                        });
                    } else if (data) {
                        data.Channel = channel.id;
                        data.save();

                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Thay dữ liệu kênh nối chữ cũ bằng kênh ${channel}.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: false
                        });
                    }
                    if (err) {
                        return interaction.reply({
                            embeds: [errEmbed],
                            ephemeral: true
                        });
                    }
                });
                break;
            case "mute":
                countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
                    if (!data) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Bạn cần setup kênh nối chữ trước.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    } else if (data) {
                        const ch = guild.channels.cache.get(data.Channel);

                        ch.PermissionFlagsBits.edit(user.id, { SendMessages: false });

                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setFooter({ text: `${member.user.tag}`, iconURL: member.displayAvatarURL() })
                                    .setDescription(`Bạn đã mute thành công ${user}.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                    if (err) {
                        return interaction.reply({ embeds: [errEmbed], ephemeral: true });
                    }
                });
                break;
            case "unmute":
                countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
                    if (!data) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Bạn cần setup kênh nối chữ trước.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    } else if (data) {
                        const ch = guild.channels.cache.get(data.Channel);

                        ch.PermissionFlagsBits.edit(user.id, { SendMessages: true });

                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setFooter({ text: `${member.user.tag}`, iconURL: member.displayAvatarURL() })
                                    .setDescription(`Bạn đã unmute thành công ${user}.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                    if (err) {
                        return interaction.reply({ embeds: [errEmbed], ephemeral: true });
                    }
                });
                break;
            case "reset":
                countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
                    if (!data) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Bạn cần setup kênh nối chữ trước.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    } else if (data) {
                        // Reset trạng thái của người chơi
                        playerStates = {};
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Đã reset trò chơi nối chữ. Người chơi tiếp theo có thể nhập bất kì từ tiếng Anh nào để bắt đầu.`)
                                    .setColor(0xECB2FB)
                                    .setTimestamp()
                            ],
                            ephemeral: false
                        });
                    }
                    if (err) {
                        return interaction.reply({ embeds: [errEmbed], ephemeral: true });
                    }
                });
                break;
        }
    }
};

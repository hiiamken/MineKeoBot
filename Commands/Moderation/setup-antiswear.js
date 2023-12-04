const {
    SlashCommandBuilder,
    Client,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");
const antiswearSchema = require("../../Models/antiswear");
const antiswearLogSchema = require("../../Models/antiswearLogChannel");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-antiswear")
        .setDescription("Ngăn chặn thành viên trên máy chủ Discord nói tục.")
        .addChannelOption(option =>
            option.setName("log-channel")
                .setDescription("*Chọn kênh để ghi lại các vi phạm.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    /**
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction, client) {
        const guild = interaction.guild;
        const logChannel = interaction.options.getChannel("log-channel");

        await interaction.deferReply();

        let requireDB = await antiswearSchema.findOne({ _id: guild.id });
        let logSchema = await antiswearLogSchema.findOne({ Guild: guild.id });

        if (logSchema) {
            await antiswearLogSchema.create({
                Guild: guild.id,
                logChannel: logChannel.id
            })
        } else if (!logSchema) {
            await antiswearLogSchema.create({
                Guild: guild.id,
                logChannel: logChannel.id
            })
        }

        const sistema = requireDB?.logs === true ? "📗 Đã kích hoạt" : "📕 Đã tắt";

        const e2 = new EmbedBuilder()
            .setTitle(`🤬 Chống nói tục`)
            .setThumbnail(client.user.displayAvatarURL())
            .setColor(0xECB2FB)
            .setImage("https://cdn.discordapp.com/attachments/1045416602847432825/1073065383092826113/standard_2.gif")
            .setDescription(
                `Chống nói tục từ ${guild.name}\n\nHệ thống hiện tại [\`${sistema}\`](https://discord.gg/kajdev).\nSử dụng nút bên dưới để cấu hình trạng thái chống nói tục của máy chủ.\nKênh log hiện tại: <#${logChannel.id}>.`
            )
            .setFooter({
                text: guild.name,
                iconURL: guild.iconURL({ dynamic: true }),
            })
            .setTimestamp(new Date());

        const b = new ButtonBuilder()
            .setLabel(`Kích hoạt`)
            .setCustomId(`true`)
            .setStyle(3)
            .setEmoji(`📗`);

        const b1 = new ButtonBuilder()
            .setLabel(`Tắt`)
            .setCustomId(`false`)
            .setStyle(4)
            .setEmoji(`📕`);

        const ac = new ActionRowBuilder().addComponents(b, b1);

        const tf = await interaction.editReply({ embeds: [e2], components: [ac] });

        const coll = tf.createMessageComponentCollector();

        coll.on("collect", async (ds) => {
            if (ds.user.id !== interaction.user.id) return;

            if (ds.customId === `true`) {
                const e = new EmbedBuilder()
                    .setDescription(`📗 Hệ thống chống nói tục đã được đặt thành **Đã kích hoạt**!`)
                    .setColor("Aqua");

                ds.update({ embeds: [e], components: [] });

                await antiswearSchema.findOneAndUpdate(
                    { _id: guild.id },
                    {
                        $set: { logs: true },
                    },
                    { upsert: true }
                );
            } else if (ds.customId === `false`) {
                const e = new EmbedBuilder()
                    .setDescription(`📕 Hệ thống chống nói tục đã được đặt thành **Đã tắt**!`)
                    .setColor("Red");

                ds.update({ embeds: [e], components: [] });

                await antiswearSchema.findOneAndUpdate(
                    { _id: guild.id },
                    {
                        $set: { logs: false },
                    },
                    { upsert: true }
                );
            }
        });
    },
};

const {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} = require("discord.js");
const linkSchema = require("../../Models/antilink"); // Hãy nhớ điều chỉnh đường dẫn tệp nếu nó không phù hợp với tệp của bạn.
const antilinkLogSchema = require("../../Models/antilinkLogChannel");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setupantilink")
        .setDescription("Ngăn chặn thành viên trên máy chủ Discord gửi liên kết.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("permissions")
                .setDescription("*Chọn quyền để bỏ qua hệ thống chống liên kết.")
                .setRequired(true)
                .addChoices(
                    { name: "Quản lý Kênh", value: "ManageChannels" },
                    { name: "Quản lý Server", value: "ManageGuild" },
                    { name: "Embed Liên kết", value: "EmbedLinks" },
                    { name: "Đính kèm Tệp", value: "AttachFiles" },
                    { name: "Quản lý Tin Nhắn", value: "ManageMessages" },
                    { name: "Quản trị viên", value: "Administrator" },
                )
        )
        .addChannelOption(option =>
            option.setName("log-channel")
                .setDescription("*Chọn kênh để ghi lại vi phạm.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    /**
    * @param {Client} client
    * @param {ChatInputCommandInteraction} interaction
    */
    async execute(interaction, client) {
        const guild = interaction.guild;
        const permissions = interaction.options.getString("permissions");
        const logChannel = interaction.options.getChannel("log-channel");

        await interaction.deferReply();

        let requireDB = await linkSchema.findOne({ _id: guild.id });
        let logSchema = await antilinkLogSchema.findOne({ Guild: guild.id });

        if (logSchema) {
            await antilinkLogSchema.create({
                Guild: guild.id,
                Perms: permissions,
                logChannel: logChannel.id
            })
        } else if (!logSchema) {
            await antilinkLogSchema.create({
                Guild: guild.id,
                Perms: permissions,
                logChannel: logChannel.id
            })
        }

        const sistema = requireDB?.logs === true ? "📗 Đã Kích Hoạt" : "📕 Đã Tắt";

        const e2 = new EmbedBuilder()
            .setTitle(`🔗 Antilink`)
            .setThumbnail(client.user.displayAvatarURL())
            .setColor(0xECB2FB)
            .setImage("https://cdn.discordapp.com/attachments/921924771883667467/1059914271926014012/standard_2.gif")
            .setDescription(
                `Antilink từ ${interaction.guild.name}\n\nHệ thống hiện đang [\`${sistema}\`](https://discord.gg/kajdev).\nSử dụng nút bên dưới để cấu hình trạng thái chống scam của máy chủ.\nQuyền bỏ qua: ${permissions}.\nKênh log hiện tại: <#${logChannel.id}>.`
            )
            .setFooter({
                text: guild.name,
                iconURL: guild.iconURL({ dynamic: true }),
            })
            .setTimestamp(new Date());

        const b = new ButtonBuilder()
            .setLabel(`Kích Hoạt`)
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
                    .setDescription(`📗 Hệ thống Antilink đã được đặt thành **Hoạt Động**!`)
                    .setColor("Aqua");

                ds.update({ embeds: [e], components: [] });

                await linkSchema.findOneAndUpdate(
                    { _id: guild.id },
                    {
                        $set: { logs: true },
                    },
                    { upsert: true }
                );
            } else if (ds.customId === `false`) {
                const e = new EmbedBuilder()
                    .setDescription(`📕 Hệ thống Antilink đã được đặt thành **Tắt**!`)
                    .setColor("Red");

                ds.update({ embeds: [e], components: [] });

                await linkSchema.findOneAndUpdate(
                    { _id: guild.id },
                    {
                        $set: { logs: false },
                    },
                    { upsert: true }
                );
            }
        });
    }
}

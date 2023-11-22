const { ButtonInteraction, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const TicketSetup = require("../../Models/TicketSetup");
const ticketSchema = require("../../Models/Ticket");

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        const { guild, member, customId, channel } = interaction;
        const { ManageChannels, SendMessages } = PermissionFlagsBits;

        if (!interaction.isButton()) return;

        if (!["close", "lock", "unlock", "claim"].includes(customId)) return;

        const docs = await TicketSetup.findOne({ GuildID: guild.id });

        if (!docs) return;

        if (!guild.members.me.permissions.has((r) => r.id === docs.Handlers))
            return interaction.reply({ content: "Tôi không thể làm điều này!", ephemeral: true });

        const embed = new EmbedBuilder();

        try {
            const data = await ticketSchema.findOne({ ChannelID: channel.id });

            if (!data) return;

            const fetchedMember = await guild.members.cache.get(data.MembersID);

            switch (customId) {
                case "close":
    if (data.Closed == true)
        return interaction.reply({ content: "Ticket chuẩn bị được xoá...", ephemeral: true });

    const transcript = await createTranscript(channel, {
        limit: -1,
        returnBuffer: false,
        fileName: `${fetchedMember ? fetchedMember.user.username : 'unknown'}-ticket${data.Type}-${data.TicketID}.html`,
    });

    await ticketSchema.updateOne({ ChannelID: channel.id }, { Closed: true });

    const transcriptEmbed = new EmbedBuilder()
        .setTitle(`Loại transcript: ${data.Type}\nId: ${data.TicketID}`)
        .setTimestamp();

    const transcriptProcess = new EmbedBuilder()
        .setTitle('Đang lưu transcript...')
        .setDescription("Ticket chuẩn bị đóng sau 10 giây")
        .setColor("Red")
        .setTimestamp();

    interaction.reply({ embeds: [transcriptProcess] });

    // Assuming data.MembersID is an array of member IDs who created the ticket
    const memberId = data.MembersID[0];

    try {
        // Fetch the member using the first member ID
        const fetchedMember = await guild.members.fetch(memberId);

        await fetchedMember.send({
            embeds: [transcriptEmbed.setDescription(`Truy cập vào transcript của bạn: ${transcript.url}`)],
            files: [transcript],
        });

        channel.delete();
    } catch (error) {
        console.error(error);
        channel.send('Không thể gửi transcript tới tin nhắn riêng.');
    }

    break;

                case "lock":
                    if (!member.permissions.has(ManageChannels))
                        return interaction.reply({ content: "Bạn không có quyền làm điều này.", ephemeral: true });

                    if (data.Locked == true)
                        return interaction.reply({ content: "Ticket này đã được khoá từ trước.", ephemeral: true });

                    await ticketSchema.updateOne({ ChannelID: channel.id }, { Locked: true });
                    embed.setDescription("Ticket đã khoá thành công!");

                    data.MembersID.forEach((m) => {
                        channel.permissionOverwrites.edit(m, { SendMessages: false });

                    });

                    return interaction.reply({ embeds: [embed] });

                case "unlock":
                    if (!member.permissions.has(ManageChannels))
                        return interaction.reply({ content: "Bạn không có quyền làm điều này.", ephemeral: true });

                    if (data.Locked == false)
                        return interaction.reply({ content: "Ticket này đã được mở khoá từ trước.", ephemeral: true });

                    await ticketSchema.updateOne({ ChannelID: channel.id }, { Locked: false });
                    embed.setDescription("Ticket đã mở khoá thành công!");

                    data.MembersID.forEach((m) => {
                        channel.permissionOverwrites.edit(m, { SendMessages: true });

                    });

                    return interaction.reply({ embeds: [embed] });

                case "claim":
                    if (!member.permissions.has(ManageChannels))
                        return interaction.reply({ content: "Bạn không có quyền làm điều này!", ephemeral: true });
                    if (data.Claimed == true)
                        return interaction.reply({ content: `Ticket đã được claim bởi <@${data.ClaimedBy}>`, ephemeral: true});

                    await ticketSchema.updateOne({ ChannelID: channel.id }, { Claimed: true, ClaimedBy: member.id });

                    embed.setDescription(`Ticket đã được claim bởi ${member}`);

                    interaction.reply({ embeds: [embed] });

                    break;

                default:
                    break;
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "Đã xảy ra lỗi khi xử lý sự kiện.", ephemeral: true });
        }
    }
};

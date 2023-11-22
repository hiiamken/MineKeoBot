const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const ticketSchema = require("../../Models/Ticket");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Cách lệnh trong ticket")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option
                .setName("action")
                .setDescription("Thêm hoặc xoá thành viên khỏi kênh ticket.")
                .setRequired(true)
                .addChoices(
                    { name: "Thêm", value: "add" },
                    { name: "Đuổi", value: "remove"}
                )
        )
        .addUserOption(option =>
            option.setName("member")
                .setDescription("Lựa chọn tên một người.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const { guildId, options, channel } = interaction;

        const action = options.getString("action");
        const member = options.getUser("member");

        const embed = new EmbedBuilder();

        try {
            const data = await ticketSchema.findOne({ GuildID: guildId, ChannelID: channel.id });

            if (!data) {
                return interaction.reply({ embeds: [embed.setColor("Red").setDescription("Lỗi rồi, hãy thử lại!")], ephemeral: true });
            }

            switch (action) {
                case "add":
                    if (data.MembersID.includes(member.id)) {
                        return interaction.reply({ embeds: [embed.setColor("Red").setDescription("Lỗi rồi, hãy thử lại!")], ephemeral: true });
                    }
            
                    data.MembersID.push(member.id);
            
                    await channel.permissionOverwrites.edit(member.id, {
                        SendMessages: true,
                        ViewChannel: true,
                        ReadMessageHistory: true
                    });
            
                    interaction.reply({ embeds: [embed.setColor("Green").setDescription(`${member} đã được thêm vào ticket.`)] });
            
                    break;
                case "remove":
                    if (!data.MembersID.includes(member.id)) {
                        return interaction.reply({ embeds: [embed.setColor("Red").setDescription("Lỗi rồi, hãy thử lại!")], ephemeral: true });
                    }
            
                    data.MembersID.remove(member.id);
            
                    await channel.permissionOverwrites.edit(member.id, {
                        SendMessages: false,
                        ViewChannel: false,
                        ReadMessageHistory: false
                    });
            
                    interaction.reply({ embeds: [embed.setColor("Green").setDescription(`${member} đã bị đuổi khỏi ticket.`)] });
            
                    break;
            }
            
            await data.save();
        } catch (err) {
            console.error(err);
            interaction.reply({ embeds: [embed.setColor("Red").setDescription("Có lỗi xảy ra!")] });
        }
    }
};

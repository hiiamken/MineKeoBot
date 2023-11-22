const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const ticketSchema = require("../../Models/Ticket");
const TicketSetup = require("../../Models/TicketSetup");

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        try {
            const { guild, member, customId, channel } = interaction;
            const { ViewChannel, SendMessages, ManageChannels, ReadMessageHistory } = PermissionFlagsBits;
            const ticketId = Math.floor(Math.random() * 9000) + 10000;

            if (!interaction.isButton()) return;

            const data = await TicketSetup.findOne({ GuildID: guild.id });

            if (!data)
                return;

            if (!data.Buttons.includes(customId))
                return;

            if (!guild.members.me.permissions.has(ManageChannels)) {
                return interaction.reply({ content: "Tôi không có quyền", ephemeral: true });
            }

            await guild.channels.create({
                name: `${member.user.username}-ticket${ticketId}`,
                type: ChannelType.GuildText,
                parent: data.Category,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                    {
                        id: member.id,
                        allow: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                    {
                        id: '1176839210603384893',
                        allow: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                ],
            }).then(async (channel) => {
                const newTicketSchema = await ticketSchema.create({
                    GuildID: guild.id,
                    MembersID: member.id,
                    TicketID: ticketId,
                    ChannelID: channel.id,
                    Closed: false,
                    Locked: false,
                    Type: customId,
                    Claimed: false,
                });

                const embed = new EmbedBuilder()
                    .setTitle(`${guild.name} - Ticket: ${customId}`)
                    .setDescription("Đội ngũ Staff sẽ sớm trả lời bạn. Vui lòng đợi trong giây lát.")
                    .setFooter({ text: `${ticketId}`, iconURL: member.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();

                const button = new ActionRowBuilder().setComponents(
                    new ButtonBuilder().setCustomId('close').setLabel('Đóng ticket').setStyle(ButtonStyle.Primary).setEmoji('❌'),
                    new ButtonBuilder().setCustomId('lock').setLabel('Khoá ticket').setStyle(ButtonStyle.Primary).setEmoji('🔒'),
                    new ButtonBuilder().setCustomId('unlock').setLabel('Mở khoá ticket').setStyle(ButtonStyle.Primary).setEmoji('🔓'),
                    new ButtonBuilder().setCustomId('claim').setLabel('Claim ticket').setStyle(ButtonStyle.Primary).setEmoji('✅')
                );

                channel.send({
                    embeds: [embed],
                    components: [button]
                });

                interaction.reply({ content: `Ticket của bạn đã được tạo! ${channel}`, ephemeral: true });
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "Đã xảy ra lỗi khi xử lý sự kiện.", ephemeral: true });
        }
    }
};

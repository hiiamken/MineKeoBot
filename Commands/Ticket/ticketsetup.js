const { Client, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require("discord.js");
const TicketSetup = require("../../Models/TicketSetup");
const { sec } = require("mathjs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticketsetup")
        .setDescription("Tạo một tin nhắn ticket.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Lựa chọn kênh bạn ticket sẽ được tạo.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption(option =>
            option.setName("category")
                .setDescription("Lựa chọn danh mục bạn ticket sẽ được tạo.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption(option =>
            option.setName("transcipts")
                .setDescription("Lựa chọn kênh các transcipt sẽ đươc gửi về.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption(option =>
            option.setName("handlers")
                .setDescription("Lựa chọn role quản lí ticket.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName("everyone")
                .setDescription("Tag role tất cả mọi người.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("firstbutton")
                .setDescription("Loại: (Name of button, Emoji)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("secondbutton")
                .setDescription("Loại: (Name of button, Emoji)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("thirdbutton")
                .setDescription("Loại: (Name of button, Emoji)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("fourthbutton")
                .setDescription("Loại: (Name of button, Emoji)")
                .setRequired(true)
        ),
        
    async execute(interaction) {
        const { guild, options } = interaction;

        try {
            const channel = options.getChannel("channel");
            const category = options.getChannel("category");
            const transcripts = options.getChannel("transcipts");

            const handlers = options.getRole("handlers");
            const everyone = options.getRole("everyone");

            const firstbutton = options.getString("firstbutton").split(",");
            const secondbutton = options.getString("secondbutton").split(",");
            const thirdbutton = options.getString("thirdbutton").split(",");
            const fourthbutton = options.getString("fourthbutton").split(",");

            const emoji1 = firstbutton[1];
            const emoji2 = secondbutton[1];
            const emoji3 = thirdbutton[1];
            const emoji4 = fourthbutton[1];

            await TicketSetup.findOneAndUpdate(
                { GuildID: guild.id },
                {
                    Channel: channel.id,
                    Category: category.id,
                    Transcripts: transcripts.id,
                    Handlers: handlers.id,
                    Everyone: everyone.id,
                    Buttons: [firstbutton[0], secondbutton[0], thirdbutton[0], fourthbutton[0]]
                },
                {
                    new: true,
                    upsert: true,
                }
            );

            const embed = new EmbedBuilder()
            .setAuthor({ name: `Tạo ticket để liên hệ với staff của MineKeo NetWork`, iconURL: 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1' })
            .setDescription("Nếu bạn đang gặp vấn đề khi gặp lỗi, cần hỗ trợ, muốn ứng tuyển staff hoặc donate chưa nhận được xu hãy tạo ticket bằng cách chọn đúng chủ đề ở bên dưới.\n\nKhung giờ hỗ trợ: **8 giờ sáng đến 10 giờ tối**\n\nVui lòng không tạo ticket với các lí do không hợp lệ vì điều đó sẽ làm ảnh hưởng đến các staff của MineKeo!\nBạn có thể cân nhắc sử dụng <#1122039700430016594> để nhận hỗ trợ từ các người chơi khác trong server.")
            .setColor(0xECB2FB)
            .setFooter({ text: 'MineKeo NetWork - Máy chủ Minecraft Việt Nam' });

            const button = new ActionRowBuilder().setComponents(
                new ButtonBuilder().setCustomId(firstbutton[0]).setLabel(firstbutton[0]).setStyle(ButtonStyle.Primary).setEmoji(emoji1),
                new ButtonBuilder().setCustomId(secondbutton[0]).setLabel(secondbutton[0]).setStyle(ButtonStyle.Primary).setEmoji(emoji2),
                new ButtonBuilder().setCustomId(thirdbutton[0]).setLabel(thirdbutton[0]).setStyle(ButtonStyle.Primary).setEmoji(emoji3),
                new ButtonBuilder().setCustomId(fourthbutton[0]).setLabel(fourthbutton[0]).setStyle(ButtonStyle.Primary).setEmoji(emoji4),
            );

            await guild.channels.cache.get(channel.id).send({
                embeds: ([embed]),
                components: [
                    button
                ]
            });

            interaction.reply({ content: "Tạo tin nhắn ticket thành công!", ephemeral: true});
        } catch (err) {
            console.log(err);
            const errEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("Có lỗi rồi...");
            
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        }
    }
}
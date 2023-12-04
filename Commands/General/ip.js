const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ip")
        .setDescription("Hiển thị IP của máy chủ"),

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

        const embed = new EmbedBuilder()
        .setAuthor({ name: `Địa chỉ  của MineKeo NetWork`, iconURL: 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1' })
        .setDescription("Máy chủ MineKeo hiện tại hỗ trợ 2 nền tảng đó là Java và Bedrock. Các bạn hãy chọn IP phù hợp để tham gia vào máy chủ nhé!")
        .setColor(0xECB2FB)
        .addFields(
            { name: 'IP Máy tính (PC)', value: 'minekeo.com', inline: true },
            { name: 'IP Điện thoại (PE)', value: 'pe.minekeo.com (19132)', inline: true },
        )
        .setTimestamp()

        await interaction.reply({
            embeds: [embed]
        });
    }
};

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vote")
        .setDescription("Xem cách link bình chọn cho máy chủ"),

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
        .setAuthor({ name: `Hãy bình chọn cho MineKeo!`, iconURL: 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1' })
        .setDescription("Bạn có thể bình chọn cho máy chủ bằng các đường link bên dưới đây. Sau khi bình chọn thành công, bạn sẽ nhận được các phần thưởng khi chơi ở các cụm trong MineKeo NetWork. \n\n**Link có thể bình chọn**\n   <:emerald:1168497260615700510>https://best-minecraft-servers.co/server-minekeo.16078/vote\n   <:gold:1168497599712612402>https://servers-minecraft.net/server-minekeo.25217\n   <:ruby:1168497958946344973>https://topg.org/minecraft-servers/server-658387\n   <:platinum:1168497904315547648>https://minecraftpocket-servers.com/server/125199/vote/\n   <:bronze:1168497795330756720>https://minecraft-mp.com/server/321971/vote/\n   <:amethyst:1168497659053625364>https://minecraft-news.net/servers/minekeo/vote\n   <:sapphire:1168497725852110878>https://minecraftservers.org/vote/655363\n\nBạn có thể bình chọn kể cả khi **Offline**. Phần thưởng sẽ được tính ở cụm mà bạn tham gia đầu tiên (Ngoại trừ Hub)")
        .setColor(0xECB2FB)
        .setTimestamp()

        await interaction.reply({
            embeds: [embed]
        });
    }
};

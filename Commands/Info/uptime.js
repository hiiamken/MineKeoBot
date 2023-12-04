const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Xem thời gian bot đã hoạt động.'),

    async execute(interaction, client) {

        const allowedChannelId = '1181147913703936021';

        if (interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            const channelMention = `<#${allowedChannel.id}>`;

            return interaction.reply({
                content: `Bạn chỉ có thể sử dụng lệnh này trong ${channelMention}.`,
                ephemeral: true,
            });
        }

        try {
            // Kiểm tra xem sự tương tác đã được xử lý hay chưa
            if (!interaction.deferred && !interaction.replied) {
                // Hoãn lại trả lời để thông báo cho Discord rằng bạn đang xử lý
                await interaction.deferReply({ ephemeral: true });

                const days = Math.floor(client.uptime / 86400000);
                const hours = Math.floor(client.uptime / 3600000) % 24;
                const minutes = Math.floor(client.uptime / 60000) % 60;
                const seconds = Math.floor(client.uptime / 1000) % 60;

                const embed = new EmbedBuilder()
                    .setTitle(`__${client.user.username}'s uptime__`)
                    .setColor(0xECB2FB)
                    .setTimestamp()
                    .addFields(
                        { name: "Uptime", value: ` \`${days}\` ngày, \`${hours}}\` giờ, \`${minutes}\` phút, \`${seconds}\` giây.` }
                    );

                // Chỉnh sửa trả lời đã hoãn lại với embed
                await interaction.editReply({ embeds: [embed] });
            } else {
                console.log("Sự tương tác đã được xử lý hoặc đã được hoãn lại trước đó.");
            }
        } catch (error) {
            console.error(error);
        }
    }
};

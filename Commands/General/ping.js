// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra ping của bot!'),
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

        const sent = await interaction.reply({ content: 'Đang kiểm tra ping...', ephemeral: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;

        await sent.edit({ content: `Ping của bot là ${ping}ms!` });
    },
};

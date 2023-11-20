// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra ping của bot!'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Đang kiểm tra ping...', ephemeral: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;

        await sent.edit({ content: `Ping của bot là ${ping}ms!` });
    },
};

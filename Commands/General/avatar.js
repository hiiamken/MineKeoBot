const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Xem avatar của bạn hoặc người khác')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người bạn muốn xem avatar')
                .setRequired(false)
        ),
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

        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const avatarURL = user.displayAvatarURL({
                format: 'png',
                size: 4096,
                dynamic: true
            });

            await interaction.reply({
                content: `Đây là avatar của ${user.tag}:`,
                embeds: [
                    {
                        image: { url: avatarURL },
                        title: `Avatar của ${user.tag}`
                    }
                ]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Lỗi rồi! Bạn hãy thử lại xem', ephemeral: true });
        }
    },
};

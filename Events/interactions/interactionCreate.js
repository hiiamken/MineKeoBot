const { CommandInteraction } = require('discord.js');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction, client) {
        if (!interaction.isCommand()) {
            return;
        }

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({ content: 'Lệnh không còn tồn tại.' });
        }

        try {
            await command.execute(interaction, client);

            // Kiểm tra nếu là button interaction và nếu là button có customId là 'verify'
            if (interaction.isButton() && interaction.customId === 'verify') {
                const role = interaction.guild.roles.cache.get('1121769384646561843');
                await interaction.member.roles.add(role);
                await interaction.followUp({ // Thay đổi từ `reply` thành `followUp`
                    content: `Bạn đã có role ${role}`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error(error);
            interaction.followUp({ // Thay đổi từ `reply` thành `followUp`
                content: 'Có lỗi xảy ra khi xử lý lệnh.',
                ephemeral: true,
            });
        }
    },
};

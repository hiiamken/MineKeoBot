const { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Xoá số tin nhắn cụ thể của 1 người hoặc 1 kênh.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tin nhắn muốn xoá.')
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Lựa chọn tin nhắn của người muốn xoá.')
                .setRequired(false)
        ),

    async execute(interaction) {
        const { channel, options } = interaction;

        const amount = options.getInteger('amount');
        const target = options.getUser("target");

        const messages = await channel.messages.fetch({
            limit: amount + 1,
        });

        const res = new EmbedBuilder()
            .setColor(0xECB2FB);

        if (target) {
            let i = 0;
            const filtered = [];

            (await messages).filter((msg) => {
                if (msg.author.id === target.id && amount > i) {
                    filtered.push(msg);
                    i++;
                }
            });

            await channel.bulkDelete(filtered).then(messages => {
                res.setDescription(`Quản trị viên đã xoá ${messages.size} tin nhắn từ ${target}.`);
                interaction.reply({ embeds: [res], ephemeral: true }); // Set ephemeral to true
            });
        } else {
            await channel.bulkDelete(amount, true).then(messages => {
                res.setDescription(`Quản trị viên đã xoá ${messages.size} tin nhắn từ kênh này.`);
                interaction.reply({ embeds: [res], ephemeral: true }); // Set ephemeral to true
            });
        }
    }
};

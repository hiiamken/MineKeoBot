const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('taoverify')
        .setDescription('Tạo kênh verify tài khoản')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Gửi tin nhắn verify vào kênh này')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            // Lấy kênh từ options
            const channel = interaction.options.getChannel('channel');

            // Tạo EmbedBuilder cho phần xác minh
            const verifyEmbed = new EmbedBuilder()
                .setTitle("Xác minh tài khoản")
                .setDescription('Bấm vào nút bên dưới để xác minh tài khoản của bạn!')
                .setColor(0xECB2FB);

            // Gửi tin nhắn và nút verify
            const sentMessage = await channel.send({
                embeds: [verifyEmbed],
                components: [
                    new ActionRowBuilder().setComponents(
                        new ButtonBuilder().setCustomId('verify').setLabel('Verify').setStyle(ButtonStyle.Success),
                    ),
                ],
            });

            // Phản hồi interaction
            await interaction.reply({ content: 'Xác minh thành công!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Lỗi rồi! Bạn hãy thử lại xem', ephemeral: true });
        }
    },
};

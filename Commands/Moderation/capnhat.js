const { SlashCommandBuilder, CommandInteraction, EmbedBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("capnhat")
        .setDescription("Tạo webhook với thông tin cụ thể."),
    
    async execute(interaction) {
        // Tạo modal
        const modal = new ModalBuilder()
            .setCustomId('createWebhookModal')
            .setTitle('Tạo Webhook');

        // Tạo các trường nhập liệu
        const titleInput = new TextInputBuilder()
            .setCustomId('webhookTitle')
            .setLabel('Title webhook')
            .setStyle(TextInputStyle.Short);

        const colorInput = new TextInputBuilder()
            .setCustomId('webhookColor')
            .setLabel('Màu hex color cho webhook')
            .setStyle(TextInputStyle.Short);

        const contentInput = new TextInputBuilder()
            .setCustomId('webhookContent')
            .setLabel('Nội dung webhook')
            .setStyle(TextInputStyle.Paragraph);

        // Thêm các trường vào modal
        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(contentInput)
        );

        // Hiển thị modal cho người dùng
        await interaction.showModal(modal);
    }
};
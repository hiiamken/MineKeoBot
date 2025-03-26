"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.clearCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clear')
        .setDescription('Xóa số lượng tin nhắn cụ thể trong kênh hiện tại.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => option.setName('amount')
        .setDescription('Số lượng tin nhắn cần xóa (tối đa 100)')
        .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member || !interaction.guild) {
            return interaction.reply({ content: '⚠ Lệnh này chỉ có thể được sử dụng trong server.', ephemeral: true });
        }
        // Kiểm tra quyền sử dụng lệnh
        if (!(0, config_1.hasPermission)(interaction.member)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        const amount = interaction.options.getInteger('amount', true);
        if (amount <= 0 || amount > 100) {
            return interaction.reply({ content: '⚠ Vui lòng nhập số lượng tin nhắn cần xóa (1 - 100).', ephemeral: true });
        }
        try {
            const channel = interaction.channel;
            const messages = await channel.messages.fetch({ limit: amount });
            await channel.bulkDelete(messages, true);
            // Lưu log vi phạm (purge) vào database
            await (0, database_1.logInfraction)(interaction.guild.id, interaction.user.id, interaction.user.id, // Người thực hiện là chính mình
            'purge', `Xóa ${messages.size} tin nhắn`);
            await interaction.reply({ content: `✅ Đã xóa ${messages.size} tin nhắn thành công!`, ephemeral: true });
        }
        catch (error) {
            console.error('Lỗi khi xóa tin nhắn:', error);
            interaction.reply({ content: '⚠ Đã xảy ra lỗi khi xóa tin nhắn.', ephemeral: true });
        }
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmuteCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.unmuteCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Gỡ mute cho người dùng.')
        .addUserOption(option => option.setName('user')
        .setDescription('Người dùng cần gỡ mute')
        .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member || !(interaction.member instanceof discord_js_1.GuildMember)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        if (!(0, config_1.hasPermission)(interaction.member)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        const user = interaction.options.getMember('user');
        if (!user) {
            return interaction.reply({ content: '⚠ Không thể tìm thấy người dùng này.', ephemeral: true });
        }
        // Kiểm tra quyền hạn trước khi unmute
        if (!(0, config_1.hasPermission)(interaction.member, user)) {
            return interaction.reply({ content: '⚠ Bạn không thể gỡ mute người có quyền cao hơn hoặc ngang bằng bạn.', ephemeral: true });
        }
        try {
            await user.timeout(null);
            // Lưu log vào database
            await (0, database_1.logInfraction)(interaction.guild.id, user.id, interaction.user.id, 'unmute', 'Gỡ mute thành công');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('🔊 Đã Gỡ Mute')
                .setDescription(`👤 Người dùng **${user.user.tag}** đã được gỡ mute bởi **${interaction.user.tag}**.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Lỗi khi gỡ mute:', error);
            return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi gỡ mute người dùng.', ephemeral: true });
        }
    }
};

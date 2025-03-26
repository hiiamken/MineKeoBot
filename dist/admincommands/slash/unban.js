"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbanCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.unbanCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unban')
        .setDescription('Gỡ cấm một người dùng khỏi server.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers)
        .addStringOption(option => option.setName('user')
        .setDescription('ID của người dùng cần gỡ cấm')
        .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member || !(interaction.member instanceof discord_js_1.GuildMember)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        if (!(0, config_1.hasPermission)(interaction.member)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        const userId = interaction.options.getString('user');
        if (!userId) {
            return interaction.reply({ content: '⚠️ Vui lòng nhập ID của người cần gỡ cấm.', ephemeral: true });
        }
        try {
            await interaction.guild?.bans.remove(userId);
            // Lưu log vào database
            await (0, database_1.logInfraction)(interaction.guild.id, userId, interaction.user.id, 'unban', 'Gỡ cấm thành công');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('🛑 Gỡ Cấm Thành Viên')
                .setDescription(`👤 Người dùng <@${userId}> đã được gỡ cấm bởi **${interaction.user.tag}**.`)
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: '✅ Người dùng đã được gỡ cấm!', ephemeral: true });
        }
        catch (error) {
            console.error('Lỗi khi unban:', error);
            return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi gỡ cấm người dùng.', ephemeral: true });
        }
    }
};

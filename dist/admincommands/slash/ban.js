"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.banCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.banCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ban')
        .setDescription('Cấm một người dùng khỏi server.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers)
        .addUserOption(option => option.setName('user')
        .setDescription('Người dùng cần bị cấm')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
        .setDescription('Lý do cấm')
        .setRequired(false))
        .addStringOption(option => option.setName('purge')
        .setDescription('Số ngày tin nhắn cần bị xóa (tối đa 7 hoặc "all" để xóa tất cả)')
        .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member || !(interaction.member instanceof discord_js_1.GuildMember)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        if (!(0, config_1.hasPermission)(interaction.member)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Không có lý do cụ thể';
        const purgeOption = interaction.options.getString('purge') || '0';
        const caseId = `MK-${Date.now().toString(36).toUpperCase()}`;
        if (!targetUser) {
            return interaction.reply({ content: '⚠️ Không tìm thấy người dùng!', ephemeral: true });
        }
        const targetMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '⚠️ Người dùng không tồn tại trong server!', ephemeral: true });
        }
        if (!targetMember.bannable) {
            return interaction.reply({ content: '⚠️ Tôi không thể cấm người dùng này!', ephemeral: true });
        }
        if ((0, config_1.hasPermission)(targetMember)) {
            return interaction.reply({ content: '⚠️ Bạn không thể cấm một người có quyền cao hơn hoặc bằng bạn!', ephemeral: true });
        }
        let deleteMessageDays = 0;
        if (purgeOption.toLowerCase() === 'all') {
            deleteMessageDays = 7;
        }
        else {
            const days = parseInt(purgeOption);
            if (!isNaN(days) && days > 0 && days <= 7) {
                deleteMessageDays = days;
            }
        }
        try {
            await targetMember.ban({ deleteMessageSeconds: deleteMessageDays * 86400, reason });
            await (0, database_1.logInfraction)(interaction.guild.id, targetUser.id, interaction.user.id, 'ban', reason);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('`🔨` Xử lý vi phạm - Ban')
                .setDescription(`\n\`📌\` **Thông tin vi phạm**\n> **Người dùng:** <@${targetUser.id}>\n> **Người xử lý:** <@${interaction.user.id}>\n> **ID:** \`${caseId}\`\n\n\`⏰\` **Thông tin cấm**\n> **Lý do:** ${reason}\n> **Thời gian:** Vĩnh viễn\n`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Xử lý bởi: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        catch (error) {
            console.error('Lỗi khi ban:', error);
            return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi cấm người dùng.', ephemeral: true });
        }
    }
};

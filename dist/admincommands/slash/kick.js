"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kickCommand = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.kickCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('kick')
        .setDescription('Đuổi một người dùng khỏi server.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers)
        .addUserOption(option => option.setName('user')
        .setDescription('Người dùng cần đuổi')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
        .setDescription('Lý do đuổi')
        .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member || !(interaction.member instanceof discord_js_1.GuildMember)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        if (!(0, config_1.hasPermission)(interaction.member)) {
            return interaction.reply({ content: '🚫 Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }
        const user = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'Không có lý do cụ thể';
        if (!user) {
            return interaction.reply({ content: '⚠ Không thể tìm thấy người dùng này.', ephemeral: true });
        }
        if (interaction.member.roles.highest.position <= user.roles.highest.position) {
            return interaction.reply({ content: '⚠ Bạn không thể kick người có quyền cao hơn hoặc ngang bằng bạn!', ephemeral: true });
        }
        try {
            await user.kick(reason);
            await (0, database_1.logInfraction)(interaction.guild.id, user.id, interaction.user.id, 'kick', reason);
            const caseId = `MK-${Date.now().toString(36).toUpperCase()}`;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#DEA2DD')
                .setTitle('👢 Xử lý vi phạm - Kick')
                .setDescription(`
  \`📌\` **Thông tin xử lý**
  > **Người dùng:** <@${user.id}>
  > **Người xử lý:** <@${interaction.user.id}>
  > **ID:** \`${caseId}\`

  \`🔨\` **Chi tiết xử lý**
  > **Lý do:** ${reason}
  `)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({
                text: `Xử lý bởi: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Lỗi khi kick:', error);
            return interaction.reply({ content: '⚠ Đã xảy ra lỗi khi đuổi người dùng.', ephemeral: true });
        }
    }
};

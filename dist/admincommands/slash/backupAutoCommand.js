"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupAutoCommand = void 0;
const discord_js_1 = require("discord.js");
const backupManager_1 = require("../../automod/backupManager");
const guildSettings_1 = require("../../database/guildSettings"); // Tự bạn viết
exports.backupAutoCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('backup-auto')
        .setDescription('Bật/tắt/tình trạng backup tự động cho server này')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('on')
        .setDescription('Bật backup tự động')
        .addIntegerOption(opt => opt.setName('interval')
        .setDescription('Khoảng thời gian (phút)')
        .setRequired(false))
        .addIntegerOption(opt => opt.setName('message_count')
        .setDescription('Số tin nhắn cần backup mỗi kênh')
        .setRequired(false)))
        .addSubcommand(sub => sub.setName('off')
        .setDescription('Tắt backup tự động'))
        .addSubcommand(sub => sub.setName('check')
        .setDescription('Kiểm tra trạng thái backup tự động')),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({ content: 'Chỉ dùng trong server.', ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        // Lấy config auto_backup
        let autoBackup = await (0, guildSettings_1.getGuildAutoBackup)(guild.id);
        if (sub === 'on') {
            const interval = interaction.options.getInteger('interval') ?? 30; // mặc định 30p
            const messageCount = interaction.options.getInteger('message_count') ?? 100;
            if (autoBackup === 1) {
                // Đã bật => clear cũ, set lại interval
                (0, backupManager_1.clearBackupInterval)(guild.id);
            }
            // Đánh dấu auto_backup=1 trong DB
            await (0, guildSettings_1.setGuildAutoBackup)(guild.id, 1);
            autoBackup = 1;
            // Gọi setBackupInterval
            (0, backupManager_1.setBackupInterval)(guild, interval, messageCount);
            await interaction.editReply(`Đã **bật** backup tự động cho server này (mỗi ${interval} phút, ${messageCount} tin/1 kênh).`);
        }
        else if (sub === 'off') {
            if (autoBackup === 1) {
                // Tắt
                (0, backupManager_1.clearBackupInterval)(guild.id);
                await (0, guildSettings_1.setGuildAutoBackup)(guild.id, 0);
                autoBackup = 0;
                await interaction.editReply('Đã **tắt** backup tự động cho server này.');
            }
            else {
                await interaction.editReply('Hiện tại **đang tắt** backup tự động.');
            }
        }
        else if (sub === 'check') {
            if (autoBackup === 1) {
                await interaction.editReply('Backup tự động đang **bật** cho server này.');
            }
            else {
                await interaction.editReply('Backup tự động đang **tắt** cho server này.');
            }
        }
    }
};

"use strict";
// src/admincommands/slash/backupCommand.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupCommand = void 0;
const discord_js_1 = require("discord.js");
const backupManager_1 = require("../../automod/backupManager");
const backupUltis_1 = require("../../automod/backupUltis");
const restoreManager_1 = require("../../automod/restoreManager");
const securityConfig_1 = __importDefault(require("../../config/securityConfig"));
exports.backupCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('backup')
        .setDescription('Quản lý backup dữ liệu server')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('create')
        .setDescription('Tạo backup dữ liệu server')
        .addIntegerOption(opt => opt.setName('message_count')
        .setDescription('Số tin nhắn cần backup cho mỗi kênh (tùy chọn)')))
        .addSubcommand(sub => sub.setName('list')
        .setDescription('Liệt kê danh sách backup đã lưu'))
        .addSubcommand(sub => sub.setName('load')
        .setDescription('Tải backup từ backup_id với các tùy chọn')
        .addStringOption(opt => opt.setName('backup_id')
        .setDescription('ID của backup cần tải')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(opt => opt.setName('components')
        .setDescription('Các phần cần phục hồi (nếu không có sẽ phục hồi toàn bộ)')))
        .addSubcommand(sub => sub.setName('delete')
        .setDescription('Xóa backup theo backup_id')
        .addStringOption(opt => opt.setName('backup_id')
        .setDescription('ID của backup cần xóa')
        .setRequired(true)
        .setAutocomplete(true)))
        .addSubcommand(sub => sub.setName('interval')
        .setDescription('Thiết lập backup tự động')
        .addStringOption(opt => opt.setName('state')
        .setDescription('"on" hoặc "off" (tạm thời chỉ hỗ trợ "on")')
        .setRequired(true))
        .addIntegerOption(opt => opt.setName('interval')
        .setDescription('Thời gian lặp lại (phút)')
        .setRequired(true))
        .addIntegerOption(opt => opt.setName('message_count')
        .setDescription('Số tin nhắn mỗi kênh sẽ được lưu'))),
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'backup_id') {
            const suggestions = await (0, backupUltis_1.getBackupIdSuggestions)();
            console.log('Suggestions:', suggestions);
            await interaction.respond(suggestions.map(id => ({ name: id, value: id })));
        }
    },
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({ content: '⚠️ Lệnh này chỉ dùng trong server.', ephemeral: true });
        }
        // Giới hạn sử dụng cho Server Owner
        const owner = await guild.fetchOwner();
        if (interaction.user.id !== owner.id) {
            return interaction.reply({ content: '❌ Chỉ **Server Owner** mới có quyền sử dụng lệnh này.', ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        try {
            if (subcommand === 'create') {
                const messageCount = interaction.options.getInteger('message_count') || undefined;
                // Sử dụng createBackupWithProgress để cập nhật tiến trình live
                const backupId = await (0, backupManager_1.createBackupWithProgress)(guild, messageCount, async (progress, text) => {
                    await interaction.editReply(`${text} (${progress}%)`);
                });
                await interaction.editReply(`✅ Đã tạo backup với ID: \`${backupId}\``);
            }
            else if (subcommand === 'list') {
                const backups = await (0, backupUltis_1.listBackups)();
                if (backups.length === 0) {
                    await interaction.editReply('📦 **Danh sách Backup:**\nKhông có backup nào.');
                    return;
                }
                const pageSize = 5;
                let currentPage = 0;
                const totalPages = Math.ceil(backups.length / pageSize);
                function createBackupEmbed(page) {
                    const startIndex = page * pageSize;
                    const endIndex = startIndex + pageSize;
                    const currentItems = backups.slice(startIndex, endIndex);
                    const description = currentItems
                        .map(b => `• \`${b.id}\`\n> **Guild ID:** ${b.guildId}\n> **Date:** ${b.date}`)
                        .join('\n\n');
                    return new discord_js_1.EmbedBuilder()
                        .setTitle('📦 Danh sách Backup')
                        .setColor('Green')
                        .setDescription(description)
                        .setFooter({ text: `Trang ${page + 1}/${totalPages} • Tổng: ${backups.length}` });
                }
                let row = new discord_js_1.ActionRowBuilder()
                    .addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setDisabled(true), new discord_js_1.ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setDisabled(totalPages <= 1));
                const embed = createBackupEmbed(currentPage);
                const message = await interaction.editReply({
                    embeds: [embed],
                    components: [row],
                });
                const collector = message.createMessageComponentCollector({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 60000
                });
                collector.on('collect', async (i) => {
                    if (!i.isButton())
                        return;
                    if (i.customId === 'prev') {
                        currentPage = Math.max(currentPage - 1, 0);
                    }
                    else if (i.customId === 'next') {
                        currentPage = Math.min(currentPage + 1, totalPages - 1);
                    }
                    const newEmbed = createBackupEmbed(currentPage);
                    row = new discord_js_1.ActionRowBuilder()
                        .addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀')
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setDisabled(currentPage === 0), new discord_js_1.ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('▶')
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages - 1));
                    await i.update({ embeds: [newEmbed], components: [row] });
                });
                collector.on('end', async () => {
                    row = new discord_js_1.ActionRowBuilder()
                        .addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀')
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setDisabled(true), new discord_js_1.ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('▶')
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setDisabled(true));
                    await message.edit({ components: [row] }).catch(() => { });
                });
            }
            else if (subcommand === 'load') {
                const backupId = interaction.options.getString('backup_id', true);
                const componentsStr = interaction.options.getString('components') || '';
                const components = componentsStr.trim().split(/\s+/).filter(Boolean);
                const requireApproval = securityConfig_1.default.restore?.requireApproval;
                if (components.length === 0) {
                    if (requireApproval) {
                        await (0, restoreManager_1.restoreFull)(guild, backupId, false);
                        await interaction.editReply(`🚩 Đã gửi yêu cầu khôi phục backup \`${backupId}\` cho Owner để chờ phê duyệt.`);
                    }
                    else {
                        await (0, restoreManager_1.restoreFull)(guild, backupId);
                        await interaction.editReply(`✅ Đã phục hồi toàn bộ dữ liệu từ backup \`${backupId}\`.`);
                    }
                }
                else {
                    if (requireApproval) {
                        await (0, restoreManager_1.restorePartial)(guild, backupId, components, false);
                        await interaction.editReply(`🚩 Đã gửi yêu cầu khôi phục backup \`${backupId}\` (thành phần: \`${components.join(', ')}\`) cho Owner để chờ phê duyệt.`);
                    }
                    else {
                        await (0, restoreManager_1.restorePartial)(guild, backupId, components);
                        await interaction.editReply(`✅ Đã phục hồi các thành phần: \`${components.join(', ')}\` từ backup \`${backupId}\`.`);
                    }
                }
            }
            else if (subcommand === 'delete') {
                const backupId = interaction.options.getString('backup_id', true);
                await (0, backupUltis_1.deleteBackup)(guild, backupId);
                await interaction.editReply(`🗑️ Backup \`${backupId}\` đã được xóa.`);
            }
            else if (subcommand === 'interval') {
                const state = interaction.options.getString('state', true).toLowerCase();
                const interval = interaction.options.getInteger('interval', true);
                const messageCount = interaction.options.getInteger('message_count') || undefined;
                if (state !== 'on') {
                    return interaction.editReply('⚠️ Hiện chỉ hỗ trợ `state = on`. Tính năng tắt sẽ được thêm sau.');
                }
                await (0, backupManager_1.setBackupInterval)(guild, interval, messageCount);
                await interaction.editReply(`⏱️ Đã bật backup tự động mỗi \`${interval}\` phút.`);
            }
        }
        catch (err) {
            console.error('[BackupCommand] Lỗi:', err);
            await interaction.editReply('❌ Đã xảy ra lỗi khi thực hiện lệnh.');
        }
    }
};

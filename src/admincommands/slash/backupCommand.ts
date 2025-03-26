// src/admincommands/slash/backupCommand.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  AutocompleteInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import { createBackupWithProgress, setBackupInterval } from '../../automod/backupManager';
import { listBackups, deleteBackup, getBackupIdSuggestions } from '../../automod/backupUltis';
import { restoreFull, restorePartial } from '../../automod/restoreManager';
import config from '../../config/securityConfig';

export const backupCommand = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Quản lý backup dữ liệu server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Tạo backup dữ liệu server')
        .addIntegerOption(opt =>
          opt.setName('message_count')
            .setDescription('Số tin nhắn cần backup cho mỗi kênh (tùy chọn)')
        )
    )

    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Liệt kê danh sách backup đã lưu')
    )

    .addSubcommand(sub =>
      sub.setName('load')
        .setDescription('Tải backup từ backup_id với các tùy chọn')
        .addStringOption(opt =>
          opt.setName('backup_id')
            .setDescription('ID của backup cần tải')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(opt =>
          opt.setName('components')
            .setDescription('Các phần cần phục hồi (nếu không có sẽ phục hồi toàn bộ)')
        )
    )

    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Xóa backup theo backup_id')
        .addStringOption(opt =>
          opt.setName('backup_id')
            .setDescription('ID của backup cần xóa')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName('interval')
        .setDescription('Thiết lập backup tự động')
        .addStringOption(opt =>
          opt.setName('state')
            .setDescription('"on" hoặc "off" (tạm thời chỉ hỗ trợ "on")')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('interval')
            .setDescription('Thời gian lặp lại (phút)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('message_count')
            .setDescription('Số tin nhắn mỗi kênh sẽ được lưu')
        )
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name === 'backup_id') {
      const suggestions = await getBackupIdSuggestions();
      console.log('Suggestions:', suggestions);
      await interaction.respond(suggestions.map(id => ({ name: id, value: id })));
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
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
        const backupId = await createBackupWithProgress(guild, messageCount, async (progress, text) => {
          await interaction.editReply(`${text} (${progress}%)`);
        });
        await interaction.editReply(`✅ Đã tạo backup với ID: \`${backupId}\``);
      }
      else if (subcommand === 'list') {
        const backups = await listBackups();
        if (backups.length === 0) {
          await interaction.editReply('📦 **Danh sách Backup:**\nKhông có backup nào.');
          return;
        }
      
        const pageSize = 5;
        let currentPage = 0;
        const totalPages = Math.ceil(backups.length / pageSize);
      
        function createBackupEmbed(page: number): EmbedBuilder {
          const startIndex = page * pageSize;
          const endIndex = startIndex + pageSize;
          const currentItems = backups.slice(startIndex, endIndex);
          const description = currentItems
            .map(b => `• \`${b.id}\`\n> **Guild ID:** ${b.guildId}\n> **Date:** ${b.date}`)
            .join('\n\n');
          return new EmbedBuilder()
            .setTitle('📦 Danh sách Backup')
            .setColor('Green')
            .setDescription(description)
            .setFooter({ text: `Trang ${page + 1}/${totalPages} • Tổng: ${backups.length}` });
        }
      
        let row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev')
              .setLabel('◀')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('▶')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(totalPages <= 1)
          );
      
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
          if (!i.isButton()) return;
          if (i.customId === 'prev') {
            currentPage = Math.max(currentPage - 1, 0);
          } else if (i.customId === 'next') {
            currentPage = Math.min(currentPage + 1, totalPages - 1);
          }
          const newEmbed = createBackupEmbed(currentPage);
          row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId('next')
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1)
            );
          await i.update({ embeds: [newEmbed], components: [row] });
        });
      
        collector.on('end', async () => {
          row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('next')
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
            );
          await message.edit({ components: [row] }).catch(() => {});
        });
      }
      else if (subcommand === 'load') {
        const backupId = interaction.options.getString('backup_id', true);
        const componentsStr = interaction.options.getString('components') || '';
        const components = componentsStr.trim().split(/\s+/).filter(Boolean);
        const requireApproval = config.restore?.requireApproval;
      
        if (components.length === 0) {
          if (requireApproval) {
            await restoreFull(guild, backupId, false);
            await interaction.editReply(`🚩 Đã gửi yêu cầu khôi phục backup \`${backupId}\` cho Owner để chờ phê duyệt.`);
          } else {
            await restoreFull(guild, backupId);
            await interaction.editReply(`✅ Đã phục hồi toàn bộ dữ liệu từ backup \`${backupId}\`.`);
          }
        } else {
          if (requireApproval) {
            await restorePartial(guild, backupId, components, false);
            await interaction.editReply(`🚩 Đã gửi yêu cầu khôi phục backup \`${backupId}\` (thành phần: \`${components.join(', ')}\`) cho Owner để chờ phê duyệt.`);
          } else {
            await restorePartial(guild, backupId, components);
            await interaction.editReply(`✅ Đã phục hồi các thành phần: \`${components.join(', ')}\` từ backup \`${backupId}\`.`);
          }
        }
      }
      else if (subcommand === 'delete') {
        const backupId = interaction.options.getString('backup_id', true);
        await deleteBackup(guild, backupId);
        await interaction.editReply(`🗑️ Backup \`${backupId}\` đã được xóa.`);
      }
      else if (subcommand === 'interval') {
        const state = interaction.options.getString('state', true).toLowerCase();
        const interval = interaction.options.getInteger('interval', true);
        const messageCount = interaction.options.getInteger('message_count') || undefined;
      
        if (state !== 'on') {
          return interaction.editReply('⚠️ Hiện chỉ hỗ trợ `state = on`. Tính năng tắt sẽ được thêm sau.');
        }
      
        await setBackupInterval(guild, interval, messageCount);
        await interaction.editReply(`⏱️ Đã bật backup tự động mỗi \`${interval}\` phút.`);
      }
    } catch (err) {
      console.error('[BackupCommand] Lỗi:', err);
      await interaction.editReply('❌ Đã xảy ra lỗi khi thực hiện lệnh.');
    }
  }
};

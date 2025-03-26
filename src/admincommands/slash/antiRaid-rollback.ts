// src/admincommands/slash/antiraid-rollback.ts

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } from 'discord.js';
  import { initDatabase } from '../../database/database';
  
  export const antiRaidRollbackCommand = {
    data: new SlashCommandBuilder()
      .setName('antiraid-rollback')
      .setDescription('Xem log và xử lý các tài khoản join nghi ngờ (AntiRaid).')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addIntegerOption(opt =>
        opt.setName('limit')
           .setDescription('Số log gần nhất cần xử lý')
           .setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: 'Lệnh này chỉ dùng trong server.', ephemeral: true });
      const limit = interaction.options.getInteger('limit') || 10;
      const db = await initDatabase();
  
      // Truy vấn các log join mà chưa được xử lý (action_status = 'pending')
      const logs = await db.all(
        `SELECT * FROM antiRaid_logs WHERE guild_id = ? AND action_status = 'pending' ORDER BY join_timestamp DESC LIMIT ?`,
        [guild.id, limit]
      );
      if (!logs || logs.length === 0) {
        return interaction.reply({ content: 'Không có log join nào đang chờ xử lý.', ephemeral: true });
      }
      
      // Tạo embed liệt kê các log
      const description = logs
        .map((log: any, index: number) => {
          return `**[${index + 1}]** <@${log.user_id}> - ${log.join_score} điểm, joined: <t:${Math.floor(log.join_timestamp / 1000)}:f>`;
        })
        .join('\n');
        
      const embed = new EmbedBuilder()
        .setTitle('Rollback AntiRaid - Log Join Pending')
        .setDescription(description)
        .setColor('Orange')
        .setFooter({ text: 'Chọn hành động cho từng mục bên dưới.' })
        .setTimestamp();
        
      // Tạo các nút tương tác cho mỗi log (ví dụ: chọn xử lý từng log theo số thứ tự)
      // Vì giới hạn số nút trong một hàng là 5, bạn có thể tạo nhiều hàng hoặc cho admin nhập số thứ tự qua một modal.
      // Ở đây, ví dụ đơn giản, ta tạo 2 nút chung: "Freeze tất cả" và "Kick tất cả"
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('rollback_freeze_all')
            .setLabel('Freeze tất cả')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('rollback_kick_all')
            .setLabel('Kick tất cả')
            .setStyle(ButtonStyle.Danger)
        );
        
      // Gửi tin nhắn rollback với embed và nút
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      
      // Tạo collector để xử lý nút bấm
      const message = await interaction.fetchReply();
      const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 60000
      });
      
      collector.on('collect', async (i) => {
        if (!i.isButton()) return;
        let processedCount = 0;
        if (i.customId === 'rollback_freeze_all') {
          // Đánh dấu các log này là 'freeze' (chỉ update trạng thái, không kick)
          for (const log of logs) {
            await db.run(`UPDATE antiRaid_logs SET action_status = 'freeze' WHERE id = ?`, [log.id]);
            processedCount++;
          }
          await i.update({ content: `Đã freeze ${processedCount} tài khoản. Admin cần kiểm tra lại trước khi quyết định ban.`, components: [] });
        } else if (i.customId === 'rollback_kick_all') {
          for (const log of logs) {
            try {
              const member = await guild.members.fetch(log.user_id);
              if (member) {
                await member.kick('Rollback AntiRaid: Đánh dấu là hành vi raid');
                processedCount++;
              }
              await db.run(`UPDATE antiRaid_logs SET action_status = 'kicked' WHERE id = ?`, [log.id]);
            } catch (error) {
              console.error(`Lỗi khi kick ${log.user_id}:`, error);
            }
          }
          await i.update({ content: `Đã kick ${processedCount} tài khoản.`, components: [] });
        }
        collector.stop();
      });
      
      collector.on('end', async () => {
        // Nếu không có hành động nào, bạn có thể cập nhật message để vô hiệu hóa nút
        const disabledRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('rollback_freeze_all')
              .setLabel('Freeze tất cả')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('rollback_kick_all')
              .setLabel('Kick tất cả')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );
        await interaction.editReply({ components: [disabledRow] });
      });
    }
  };
  
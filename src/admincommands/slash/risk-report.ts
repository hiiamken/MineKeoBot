// src/commands/admincommands/slash/riskReport.ts

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    User,
  } from 'discord.js';
  import { getRiskScore } from '../../automod/riskScore';
  import { initDatabase } from '../../database/database';
  
  export const riskReport = {
    data: new SlashCommandBuilder()
      .setName('risk-report')
      .setDescription('📊 Hiển thị báo cáo rủi ro của người dùng')
      .addUserOption(opt =>
        opt.setName('user').setDescription('Người dùng cần xem').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('log_type')
          .setDescription('Lọc theo loại log')
          .setChoices(
            { name: 'Tất cả', value: 'all' },
            { name: 'Start', value: 'start' },
            { name: 'End', value: 'end' },
            { name: 'Error', value: 'error' }
          )
      ),
  
    async execute(interaction: ChatInputCommandInteraction) {
      const db = await initDatabase();
      const user = interaction.options.getUser('user', true);
      const logType = interaction.options.getString('log_type') || 'all';
      const guildId = interaction.guild?.id;
      if (!guildId) return interaction.reply({ content: '❌ Lỗi: Không xác định được server.', ephemeral: true });
  
      await interaction.deferReply({ ephemeral: true });
  
      try {
        const riskScore = await getRiskScore(guildId, user.id);
  
        const logs = await db.all(
          `SELECT * FROM restore_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 10`,
          [guildId]
        );
  
        const filteredLogs = logs.filter(log => {
          if (logType === 'all') return true;
          if (log.action?.startsWith(logType)) return true;
          return false;
        });
  
        const logText = filteredLogs.length
          ? filteredLogs.map(l => `• \`${l.action}\` <t:${Math.floor(new Date(l.timestamp).getTime() / 1000)}:R>`).join('\n')
          : '*Không có log nào phù hợp.*';
  
        const embed = new EmbedBuilder()
          .setColor('Orange')
          .setTitle(`📋 Báo cáo rủi ro: ${user.tag}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: '🧠 Risk Score', value: `${riskScore ?? 0}`, inline: true },
            { name: '📦 Log Khôi Phục Gần Đây', value: logText }
          )
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp();
  
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('❌ Xóa Log')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`risk_clear_${user.id}`),
  
          new ButtonBuilder()
            .setLabel('🔨 Ban User')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`risk_ban_${user.id}`)
        );
  
        await interaction.editReply({ embeds: [embed], components: [row] });
  
        const msg = await interaction.fetchReply();
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
  
        collector.on('collect', async (btn) => {
          if (btn.user.id !== interaction.user.id) return btn.reply({ content: '⛔ Bạn không có quyền.', ephemeral: true });
  
          if (btn.customId === `risk_clear_${user.id}`) {
            await db.run(`DELETE FROM restore_logs WHERE guild_id = ?`, [guildId]);
            await btn.reply({ content: '🧹 Đã xóa toàn bộ log khôi phục.', ephemeral: true });
          }
  
          if (btn.customId === `risk_ban_${user.id}`) {
            await interaction.guild?.members.ban(user.id, { reason: '🔨 Risk Report: Ban thủ công từ admin' }).catch(() => null);
            await btn.reply({ content: `🔨 Đã ban ${user.tag}.`, ephemeral: true });
          }
        });
  
    } catch (err) {
        console.error('[RiskReport Lỗi]:', err);
        await (interaction as ChatInputCommandInteraction).editReply({
          content: '❌ Không thể tạo báo cáo rủi ro.'
        });
      }
    }
  };
  
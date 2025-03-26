// src/admincommands/slash/antinuke-rollback.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { initDatabase } from '../../database/database';

export const antinukeRollbackCommand = {
  data: new SlashCommandBuilder()
    .setName('antinuke-rollback')
    .setDescription('Rollback các hành động AntiNuke của một người dùng.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('Người dùng cần rollback')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('limit')
        .setDescription('Số hành động rollback gần nhất')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Lệnh này chỉ dùng trong server.', ephemeral: true });
    const targetUser = interaction.options.getUser('target', true);
    const limit = interaction.options.getInteger('limit') || 3;
    const db = await initDatabase();
    // Lấy log chi tiết của targetUser từ bảng antinuke_detailed_logs
    const logs = await db.all(
      `SELECT * FROM antinuke_detailed_logs WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [guild.id, targetUser.id, limit]
    );
    if (!logs || logs.length === 0) {
      return interaction.reply({ content: `Không có log nào của ${targetUser.tag} để rollback.`, ephemeral: true });
    }
    // Giả sử bạn chỉ rollback các action "CHANNEL_DELETE" (ví dụ)
    const rollbackLogs = logs.filter((log: any) => log.action === 'CHANNEL_DELETE');
    let rollbackCount = 0;
    for (const log of rollbackLogs) {
      const beforeData = JSON.parse(log.before_data);
      // Nếu action là CHANNEL_DELETE, tạo lại kênh
      try {
        await guild.channels.create({
          name: beforeData.name,
          type: beforeData.type, // Bạn có thể cần chuyển đổi sang số nếu cần
          parent: beforeData.parent_id ?? undefined,
          position: beforeData.position,
          topic: beforeData.topic ?? undefined,
          reason: 'Rollback từ AntiNuke'
        });
        rollbackCount++;
      } catch (err) {
        console.error(`Lỗi khi rollback kênh ${beforeData.name}:`, err);
      }
    }
    const embed = new EmbedBuilder()
      .setTitle('Rollback AntiNuke')
      .setDescription(`Đã rollback ${rollbackCount} hành động CHANNEL_DELETE cho ${targetUser.tag}.`)
      .setColor('Green')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

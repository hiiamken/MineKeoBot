import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    EmbedBuilder
  } from 'discord.js';
  import fs from 'fs';
  import path from 'path';
  
  /**
   * Lệnh /checkbot, chỉ dành cho Admin.
   */
  export const checkBotCommand = {
    data: new SlashCommandBuilder()
      .setName('checkbot')
      .setDescription('🔍 Kiểm tra dữ liệu của bot: uptime, dung lượng database, ping, RAM')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Chỉ Admin
  
    async execute(interaction: ChatInputCommandInteraction) {
      // 1) Tính uptime
      const uptimeSeconds = process.uptime(); // số giây bot đã chạy
      const uptimeString = formatUptime(uptimeSeconds);
  
      // 2) Lấy dung lượng database.sqlite
      let dbSize = 'Không xác định';
      try {
        // Đảm bảo path.resolve tới đúng file DB của bạn
        const dbPath = path.resolve(process.cwd(), 'database.sqlite');
        const stats = fs.statSync(dbPath);
        dbSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
      } catch (err) {
        console.error('[CHECKBOT] Không lấy được dung lượng database:', err);
      }
  
      // 3) Ping của bot
      const ping = interaction.client.ws.ping; // ms
  
      // 4) RAM usage (đang dùng)
      const usedMemoryBytes = process.memoryUsage().rss; // RAM bot đang chiếm
      const usedMemoryMB = (usedMemoryBytes / (1024 * 1024)).toFixed(2) + ' MB';
  
      // Tạo embed hiển thị
      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('🤖 Thông tin Bot')
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/4712/4712027.png') // Đổi link icon nếu muốn
        .addFields(
          { name: 'Uptime',    value: uptimeString,     inline: false },
          { name: 'Database',  value: dbSize,           inline: false },
          { name: 'Ping',      value: `${ping} ms`,     inline: false },
          { name: 'RAM',       value: usedMemoryMB,     inline: false }
        )
        .setFooter({ text: 'Thông tin cập nhật từ bot' });
  
      // Gửi tin nhắn ephemeral (chỉ admin thấy)
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  };
  
  /**
   * Chuyển số giây thành chuỗi "x giờ y phút z giây"
   */
  function formatUptime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  }
  
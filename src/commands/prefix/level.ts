import {
    Message,
    TextChannel,
    DMChannel,
    ThreadChannel,
    EmbedBuilder
  } from 'discord.js';
  import { getUserLevel, getRequiredXp } from '../../levels/levelManager';
  
  /**
   * Tạo thanh tiến trình text-based.
   * @param currentXP XP hiện tại
   * @param requiredXP XP cần để lên level
   * @param barLength Độ dài thanh (mặc định 20)
   */
  function createProgressBar(currentXP: number, requiredXP: number, barLength = 20): string {
    const progress = Math.floor((currentXP / requiredXP) * barLength);
    const bar = '█'.repeat(progress) + '░'.repeat(barLength - progress);
    return `\`${bar}\``;
  }
  
  export const levelPrefixCommand = {
    name: 'level',
    description: 'Xem cấp độ của bạn hoặc người khác (prefix) - không hiển thị tên/ID',
    async execute(message: Message, args: string[]) {
      if (!message.guild) return;
  
      // Nếu không có đối số => chính là người gửi
      let userId = message.author.id;
      if (args.length > 0) {
        // Nếu có đối số => kiểm tra mention hoặc ID
        const rawInput = args[0];
        const match = rawInput.match(/^<@!?(\d+)>$/);
        userId = match ? match[1] : rawInput;
      }
  
      // Lấy cấp độ và XP
      const { xp, level } = await getUserLevel(message.guild.id, userId);
      const required = getRequiredXp(level);
  
      // Tạo thanh tiến trình + tính % XP
      const progressBar = createProgressBar(xp, required);
      const percent = ((xp / required) * 100).toFixed(1);
  
      // Lấy avatar user (nếu cần hiển thị ảnh)
      const user = await message.client.users.fetch(userId);
  
      // Tạo Embed
      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        // Tiêu đề với icon trong backticks
        .setTitle('`🏆` | Thông Tin Cấp Độ')
        .setThumbnail(user.displayAvatarURL({ forceStatic: false, size: 128 }))
        .addFields({
          name: 'Cấp Độ',
          // Mỗi dòng bắt đầu bằng ">"
          value:
            `> **Cấp**: ${level}\n` +
            `> **XP**: ${xp} / ${required} (${percent}%)\n` +
            `> **Tiến Trình**: ${progressBar}`
        })
        .setTimestamp();
  
      // Gửi Embed
      if (message.channel.isTextBased()) {
        const channel = message.channel as TextChannel | DMChannel | ThreadChannel;
        await channel.send({ embeds: [embed] });
      }
    },
  };
  
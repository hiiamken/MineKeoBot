import { Message, TextChannel, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const unbanCommand = {
  name: 'unban',
  description: 'Gỡ cấm một người dùng khỏi server.',

  async execute(message: Message, args: string[]) {
    if (!message.member || !hasPermission(message.member)) {
      return (message.channel as TextChannel).send('🚫 Bạn không có quyền sử dụng lệnh này!');
    }

    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) {
      return (message.channel as TextChannel).send('⚠ Vui lòng cung cấp ID của người cần gỡ cấm.');
    }

    try {
      await message.guild?.bans.remove(userId);

      // Lưu log vào database
      await logInfraction(message.guild!.id, userId, message.author.id, 'unban', 'Gỡ cấm thành công');

      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('🔓 Gỡ Cấm Thành Viên')
        .setDescription(`✅ Người dùng <@${userId}> đã được gỡ cấm bởi **${message.author.tag}**.`)
        .setTimestamp();

      await (message.channel as TextChannel).send({ embeds: [embed] });

    } catch (error) {
      console.error('Lỗi khi unban:', error);
      (message.channel as TextChannel).send('⚠ Đã xảy ra lỗi khi gỡ cấm người dùng.');
    }
  }
};

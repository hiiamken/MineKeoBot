import { Message, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const unmuteCommand = {
  name: 'unmute',
  description: 'Gỡ mute một người dùng.',

  async execute(message: Message, args: string[]) {
    if (!message.member || !hasPermission(message.member)) {
      return (message.channel as TextChannel).send('🚫 Bạn không có quyền sử dụng lệnh này!');
    }

    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) {
      return (message.channel as TextChannel).send('⚠ Vui lòng cung cấp ID hoặc mention người cần gỡ mute.');
    }

    const user = await message.guild?.members.fetch(userId).catch(() => null);
    if (!user) {
      return (message.channel as TextChannel).send('⚠ Người dùng không tồn tại hoặc không bị mute.');
    }

    // Kiểm tra quyền hạn trước khi unmute
    if (!hasPermission(message.member, user)) {
      return (message.channel as TextChannel).send('⚠ Bạn không thể gỡ mute người có quyền cao hơn hoặc ngang bằng bạn.');
    }

    try {
      await user.timeout(null);

      // Lưu log vào database
      await logInfraction(message.guild!.id, user.id, message.author.id, 'unmute', 'Gỡ mute thành công');

      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('🔊 Đã Gỡ Mute')
        .setDescription(`👤 Người dùng **${user.user.tag}** đã được gỡ mute bởi **${message.author.tag}**.`)
        .setTimestamp();

      await (message.channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi khi gỡ mute:', error);
      return (message.channel as TextChannel).send('⚠ Đã xảy ra lỗi khi gỡ mute người dùng.');
    }
  }
};

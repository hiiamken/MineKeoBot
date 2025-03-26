import { Message, TextChannel } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const name = 'clear';
export const description = 'Xóa số lượng tin nhắn cụ thể trong kênh hiện tại.';

export async function execute(message: Message, args: string[]) {
  if (!message.member || !hasPermission(message.member)) {
    return (message.channel as TextChannel).send('🚫 Bạn không có quyền sử dụng lệnh này!');
  }

  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0 || amount > 100) {
    return (message.channel as TextChannel).send('⚠ Vui lòng nhập số lượng tin nhắn cần xóa (1 - 100).');
  }

  try {
    const channel = message.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: amount });

    await channel.bulkDelete(messages, true);

    // Lưu log vi phạm (purge) vào database
    await logInfraction(
      message.guild!.id,
      message.author.id,
      message.author.id, // Người thực hiện là chính mình
      'purge',
      `Xóa ${messages.size} tin nhắn`
    );

    const confirmMessage = await channel.send(`✅ Đã xóa ${messages.size} tin nhắn thành công!`);
    setTimeout(() => confirmMessage.delete(), 5000);
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn:', error);
    (message.channel as TextChannel).send('⚠ Đã xảy ra lỗi khi xóa tin nhắn.');
  }
}

// src/events/expHandler.ts
import { Message } from 'discord.js';
import { addXp, addMessageCount } from '../levels/levelManager';

/**
 * Xử lý XP và tin nhắn cho mỗi tin nhắn của người dùng.
 * Mỗi tin nhắn sẽ cộng XP (ví dụ: 5 XP) và tăng count tin nhắn.
 */
export async function handleExp(message: Message) {
  if (message.author.bot) return;
  
  const xpToAdd = 5; // Số XP mỗi tin nhắn
  try {
    await addXp(message.guild!.id, message.author.id, xpToAdd);
    await addMessageCount(message.guild!.id, message.author.id);
  } catch (error) {
    console.error("Lỗi khi cập nhật XP/tin nhắn:", error);
  }
}

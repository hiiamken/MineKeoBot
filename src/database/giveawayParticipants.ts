import { initDatabase } from './database';

/**
 * ➕ Thêm người tham gia vào giveaway
 */
export async function addParticipant(messageId: string, userId: string) {
  const db = await initDatabase();
  await db.run(
    `INSERT OR IGNORE INTO giveaway_participants (message_id, user_id) VALUES (?, ?)`,
    [messageId, userId]
  );
}

/**
 * ❌ Xóa người tham gia khỏi giveaway
 */
export async function removeParticipant(messageId: string, userId: string) {
  const db = await initDatabase();

  await db.run(
    `DELETE FROM giveaway_participants WHERE message_id = ? AND user_id = ?`,
    [messageId, userId]
  );
}

/**
 * 🔢 Đếm số lượng người tham gia giveaway
 */
export async function countParticipants(messageId: string): Promise<number> {
  const db = await initDatabase();
  const result = await db.get<{ total: number }>(
    `SELECT COUNT(*) as total FROM giveaway_participants WHERE message_id = ?`,
    [messageId]
  );
  return result?.total ?? 0;
}

/**
 * 🎲 Chọn người thắng ngẫu nhiên từ danh sách người tham gia
 */
export async function randomParticipants(messageId: string, limit: number): Promise<{ user_id: string }[]> {
  const db = await initDatabase();
  const winners = await db.all<{ user_id: string }[]>(
    `SELECT user_id
     FROM giveaway_participants
     WHERE message_id = ?
     ORDER BY RANDOM()
     LIMIT ?`,
    [messageId, limit]
  );
  return winners;
}

/**
 * 📋 Lấy danh sách tất cả người tham gia giveaway
 */
export async function getGiveawayParticipants(messageId: string): Promise<{ user_id: string }[]> {
  const db = await initDatabase();
  const participants = await db.all<{ user_id: string }[]>(
    `SELECT user_id FROM giveaway_participants WHERE message_id = ?`,
    [messageId]
  );

  return participants;
}

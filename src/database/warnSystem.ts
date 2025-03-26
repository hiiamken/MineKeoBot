import { initDatabase } from './database';

/**
 * Ghi lại cảnh cáo của một người dùng
 */
export async function warnUser(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string = 'Không có lý do'
) {
  return await addWarning(guildId, userId, moderatorId, reason);
}

/**
 * Thêm cảnh cáo mới và trả về tổng số cảnh cáo
 */
export async function addWarning(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string = 'Không có lý do'
): Promise<number> {
  const db = await initDatabase();

  await db.run(
    `INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [guildId, userId, moderatorId, reason]
  );

  const row = await db.get(
    `SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?`,
    [guildId, userId]
  );

  return row ? row.count : 0;
}

/**
 * Lấy danh sách cảnh cáo
 */
export async function getWarnings(
  guildId: string,
  userId: string
): Promise<{ reason: string; timestamp: string }[]> {
  const db = await initDatabase();
  return db.all(
    `SELECT reason, timestamp FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC`,
    [guildId, userId]
  );
}

/**
 * Xoá toàn bộ cảnh cáo
 */
export async function clearWarnings(guildId: string, userId: string): Promise<void> {
  const db = await initDatabase();
  await db.run(`DELETE FROM warnings WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
}

/* -------------------------- LEGIT LINK CONFIRMATION -------------------------- */

/**
 * ✅ Thêm link đã xác nhận hợp lệ từ người dùng
 */
export async function confirmLegitLink(userId: string, link: string): Promise<void> {
  const db = await initDatabase();
  await db.run(
    `INSERT OR REPLACE INTO link_confirmations (user_id, link, confirmed_at) VALUES (?, ?, ?)`,
    [userId, link, Date.now()]
  );
}

/**
 * ❓ Kiểm tra xem user đã xác nhận link đó chưa
 */
export async function isLinkConfirmed(userId: string, link: string): Promise<boolean> {
  const db = await initDatabase();
  const row = await db.get(
    `SELECT 1 FROM link_confirmations WHERE user_id = ? AND link = ?`,
    [userId, link]
  );
  return !!row;
}

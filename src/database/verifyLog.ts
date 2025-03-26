import { initDatabase } from './database';

/**
 * Ghi nhận rằng người dùng đã xác minh thành công
 * @param userId - ID của người dùng
 */
export async function markUserVerified(userId: string): Promise<void> {
  const db = await initDatabase();
  await db.run(
    `INSERT OR REPLACE INTO verify_log (user_id, verified_at) VALUES (?, ?)`,
    [userId, Date.now()]
  );
}

/**
 * Kiểm tra xem người dùng đã xác minh hay chưa
 * @param userId - ID của người dùng
 * @returns true nếu người dùng đã xác minh, false nếu chưa
 */
export async function isUserVerified(userId: string): Promise<boolean> {
  const db = await initDatabase();
  const result = await db.get(`SELECT * FROM verify_log WHERE user_id = ?`, [userId]);
  return !!result;
}

/**
 * Lấy thời gian xác minh của người dùng
 * @param userId - ID của người dùng
 * @returns Thời gian xác minh (ms) hoặc null nếu chưa xác minh
 */
export async function getVerificationTime(userId: string): Promise<number | null> {
  const db = await initDatabase();
  const result = await db.get(`SELECT verified_at FROM verify_log WHERE user_id = ?`, [userId]);
  return result ? result.verified_at : null;
}

/**
 * Xóa dữ liệu xác minh của người dùng (nếu cần reset)
 * @param userId - ID của người dùng
 */
export async function removeUserVerification(userId: string): Promise<void> {
  const db = await initDatabase();
  await db.run(`DELETE FROM verify_log WHERE user_id = ?`, [userId]);
}

/**
 * Lấy danh sách tất cả người dùng đã xác minh
 * @returns Mảng người dùng đã xác minh cùng thời gian
 */
export async function getAllVerifiedUsers(): Promise<{ user_id: string; verified_at: number }[]> {
  const db = await initDatabase();
  return db.all(`SELECT * FROM verify_log ORDER BY verified_at DESC`);
}

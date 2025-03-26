import { initDatabase } from './database';

/**
 * Lấy danh sách top 10 người có số lần mời hợp lệ cao nhất
 * @param guildId ID của máy chủ
 * @param limit Số người muốn lấy (mặc định: 10)
 * @returns Danh sách top người có số lần mời hợp lệ cao nhất
 */
export async function getTopInviters(guildId: string, limit: number = 10) {
    const db = await initDatabase();
    return db.all(
        `SELECT user_id, invite_count FROM invites WHERE guild_id = ? ORDER BY invite_count DESC LIMIT ?`,
        [guildId, limit]
    );
}

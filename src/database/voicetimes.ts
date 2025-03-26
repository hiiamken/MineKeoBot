import { initDatabase } from './database';

/**
 * Lấy danh sách top 10 người có thời gian voice cao nhất
 * @param guildId ID của máy chủ
 * @param limit Số người muốn lấy (mặc định: 10)
 * @returns Danh sách top người có thời gian voice cao nhất
 */
export async function getTopVoiceUsers(guildId: string, limit: number = 10) {
    const db = await initDatabase();
    return db.all(
        `SELECT user_id, SUM(total_time) as total_time FROM voicetimes WHERE guild_id = ? GROUP BY user_id ORDER BY total_time DESC LIMIT ?`,
        [guildId, limit]
    );
}

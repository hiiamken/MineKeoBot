import { initDatabase } from './database';

/**
 * Lấy danh sách top 10 người đã gửi nhiều tin nhắn nhất
 * @param guildId ID của máy chủ
 * @param limit Số người muốn lấy (mặc định: 10)
 * @returns Danh sách top người có số lượng tin nhắn cao nhất
 */
export async function getTopMessageSenders(guildId: string, limit: number = 10) {
    const db = await initDatabase();
    return db.all(
        `SELECT user_id, message_count FROM messages WHERE guild_id = ? ORDER BY message_count DESC LIMIT ?`,
        [guildId, limit]
    );
}

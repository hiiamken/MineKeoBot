// src/automod/antinukeDetailedLogs.ts

import { initDatabase } from '../database/database';

/**
 * Ghi log chi tiết cho các hành động AntiNuke.
 * @param guildId ID của server.
 * @param userId ID người thực hiện hành động.
 * @param action Tên hành động (ví dụ: "CHANNEL_DELETE", "ROLE_DELETE").
 * @param targetId ID đối tượng bị tác động.
 * @param beforeData Dữ liệu trạng thái trước (JSON object).
 * @param afterData Dữ liệu trạng thái sau (JSON object, có thể là {} nếu đã bị xóa).
 * @param timestamp Thời gian hành động (ms). Mặc định là thời gian hiện tại.
 */
export async function logDetailedAction(
  guildId: string,
  userId: string,
  action: string,
  targetId: string,
  beforeData: any,
  afterData: any,
  timestamp: number = Date.now()
): Promise<void> {
  const db = await initDatabase();
  await db.run(
    `INSERT INTO antinuke_detailed_logs 
     (guild_id, user_id, action, target_id, before_data, after_data, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      guildId,
      userId,
      action,
      targetId,
      JSON.stringify(beforeData),
      JSON.stringify(afterData),
      timestamp
    ]
  );
}

// src/automod/antiRaidDetailedLogs.ts
import { initDatabase } from '../database/database';

export async function logJoinDetail(
  guildId: string,
  userId: string,
  joinScore: number,
  accountAgeDays: number,
  hasAvatar: number,
  rawData: any
): Promise<void> {
  const db = await initDatabase();
  await db.run(
    `INSERT INTO antiRaid_logs (guild_id, user_id, join_timestamp, join_score, account_age_days, has_avatar, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      guildId,
      userId,
      Date.now(),
      joinScore,
      accountAgeDays,
      hasAvatar,
      JSON.stringify(rawData)
    ]
  );
}

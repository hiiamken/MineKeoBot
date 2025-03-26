// src/levels/levelManager.ts
import { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { initDatabase } from '../database/database';

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;

async function getDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

/**
 * Lấy top n người chơi theo XP (descending).
 */
export async function getTopPlayers(guildId: string, limit = 10): Promise<{ user_id: string; xp: number; level: number }[]> {
  const db = await getDB();

  // rows phải là một mảng
  const rows = await db.all<{ user_id: string; xp: number; level: number }[]>(
    `SELECT user_id, xp, level
     FROM levels
     WHERE guild_id = ?
     ORDER BY level DESC, xp DESC
     LIMIT ?`,
    guildId, limit
  );

  // Trả về mảng
  return rows;
}

/**
 * Tính XP cần thiết cho level tiếp theo
 * Sử dụng công thức: requiredXp = 5 * level^2 + 50 * level + 100
 */
export function getRequiredXp(level: number): number {
  return 5 * (level * level) + 50 * level + 100;
}

/**
 * Thêm XP cho người dùng và kiểm tra Level Up.
 * Nếu chưa có dữ liệu, INSERT; nếu có, UPDATE.
 */
export async function addXp(guildId: string, userId: string, xpToAdd: number): Promise<{ xp: number, level: number, leveledUp: boolean }> {
  const db = await getDB();
  const row = await db.get("SELECT xp, level FROM levels WHERE guild_id = ? AND user_id = ?", guildId, userId);
  let xp = 0, level = 1, leveledUp = false;
  if (!row) {
    xp = xpToAdd;
    level = 1;
    await db.run("INSERT INTO levels (guild_id, user_id, xp, level) VALUES (?, ?, ?, ?)", guildId, userId, xp, level);
  } else {
    xp = row.xp + xpToAdd;
    level = row.level;
    await db.run("UPDATE levels SET xp = ? WHERE guild_id = ? AND user_id = ?", xp, guildId, userId);
  }
  const required = getRequiredXp(level);
  if (xp >= required) {
    level++;
    leveledUp = true;
    await db.run("UPDATE levels SET level = ? WHERE guild_id = ? AND user_id = ?", level, guildId, userId);
  }
  return { xp, level, leveledUp };
}

/**
 * Tăng số tin nhắn cho người dùng.
 */
export async function addMessageCount(guildId: string, userId: string): Promise<number> {
  const db = await getDB();
  const row = await db.get("SELECT message_count FROM messages WHERE guild_id = ? AND user_id = ?", guildId, userId);
  let messageCount = 1;
  if (!row) {
    await db.run("INSERT INTO messages (guild_id, user_id, message_count) VALUES (?, ?, ?)", guildId, userId, messageCount);
  } else {
    messageCount = row.message_count + 1;
    await db.run("UPDATE messages SET message_count = ? WHERE guild_id = ? AND user_id = ?", messageCount, guildId, userId);
  }
  return messageCount;
}

/**
 * Lấy thông tin Level của người dùng.
 */
export async function getUserLevel(guildId: string, userId: string): Promise<{ xp: number, level: number }> {
  const db = await getDB();
  const row = await db.get("SELECT xp, level FROM levels WHERE guild_id = ? AND user_id = ?", guildId, userId);
  return row ? { xp: row.xp, level: row.level } : { xp: 0, level: 1 };
}

/**
 * Lấy số tin nhắn của người dùng.
 */
export async function getMessageCount(guildId: string, userId: string): Promise<number> {
  const db = await getDB();
  const row = await db.get("SELECT message_count FROM messages WHERE guild_id = ? AND user_id = ?", guildId, userId);
  return row ? row.message_count : 0;
}

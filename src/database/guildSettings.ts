// src/database/guildSettings.ts
import { initDatabase } from './database'; // nơi bạn export initDatabase
import { Database } from 'sqlite';

export async function getGuildAutoBackup(guildId: string): Promise<number> {
  const db: Database = await initDatabase();
  const row = await db.get<{ auto_backup: number }>(
    'SELECT auto_backup FROM guild_settings WHERE guild_id = ?',
    [guildId]
  );
  return row ? row.auto_backup : 0; // mặc định 0 nếu chưa có
}

export async function setGuildAutoBackup(guildId: string, value: number): Promise<void> {
  const db: Database = await initDatabase();
  await db.run(
    `INSERT INTO guild_settings (guild_id, auto_backup)
     VALUES (?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET auto_backup=excluded.auto_backup`,
    [guildId, value]
  );
}

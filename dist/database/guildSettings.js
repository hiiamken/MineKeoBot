"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuildAutoBackup = getGuildAutoBackup;
exports.setGuildAutoBackup = setGuildAutoBackup;
// src/database/guildSettings.ts
const database_1 = require("./database"); // nơi bạn export initDatabase
async function getGuildAutoBackup(guildId) {
    const db = await (0, database_1.initDatabase)();
    const row = await db.get('SELECT auto_backup FROM guild_settings WHERE guild_id = ?', [guildId]);
    return row ? row.auto_backup : 0; // mặc định 0 nếu chưa có
}
async function setGuildAutoBackup(guildId, value) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT INTO guild_settings (guild_id, auto_backup)
     VALUES (?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET auto_backup=excluded.auto_backup`, [guildId, value]);
}

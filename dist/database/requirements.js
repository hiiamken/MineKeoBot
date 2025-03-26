"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserLevel = getUserLevel;
exports.getUserMoney = getUserMoney;
exports.getUserInvites = getUserInvites;
const database_1 = require("./database");
/**
 * Lấy level của user từ bảng `levels`
 *  - cột: level
 *  - PK: (guild_id, user_id)
 */
async function getUserLevel(guildId, userId) {
    const db = await (0, database_1.initDatabase)();
    const row = await db.get(`SELECT level
     FROM levels
     WHERE guild_id = ?
       AND user_id = ?`, [guildId, userId]);
    if (!row) {
        // Nếu chưa có record => mặc định level=1 (hoặc 0 tuỳ bạn)
        return 1;
    }
    return row.level;
}
/**
 * Lấy số tiền (money) của user từ bảng `economy`
 *  - cột: money
 *  - PK: (guild_id, user_id)
 */
async function getUserMoney(guildId, userId) {
    const db = await (0, database_1.initDatabase)();
    const row = await db.get(`SELECT money
     FROM economy
     WHERE guild_id = ?
       AND user_id = ?`, [guildId, userId]);
    if (!row) {
        // Nếu chưa có => mặc định = 0
        return 0;
    }
    return row.money;
}
/**
 * Lấy số lần mời (invite_count) của user từ bảng `invites`
 *  - cột: invite_count
 *  - PK: (guild_id, user_id)
 */
async function getUserInvites(guildId, userId) {
    const db = await (0, database_1.initDatabase)();
    const row = await db.get(`SELECT invite_count
     FROM invites
     WHERE guild_id = ?
       AND user_id = ?`, [guildId, userId]);
    if (!row) {
        // Nếu chưa có => mặc định = 0
        return 0;
    }
    return row.invite_count;
}

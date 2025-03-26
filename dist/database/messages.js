"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopMessageSenders = getTopMessageSenders;
const database_1 = require("./database");
/**
 * Lấy danh sách top 10 người đã gửi nhiều tin nhắn nhất
 * @param guildId ID của máy chủ
 * @param limit Số người muốn lấy (mặc định: 10)
 * @returns Danh sách top người có số lượng tin nhắn cao nhất
 */
async function getTopMessageSenders(guildId, limit = 10) {
    const db = await (0, database_1.initDatabase)();
    return db.all(`SELECT user_id, message_count FROM messages WHERE guild_id = ? ORDER BY message_count DESC LIMIT ?`, [guildId, limit]);
}

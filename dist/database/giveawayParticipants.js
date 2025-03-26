"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addParticipant = addParticipant;
exports.removeParticipant = removeParticipant;
exports.countParticipants = countParticipants;
exports.randomParticipants = randomParticipants;
exports.getGiveawayParticipants = getGiveawayParticipants;
const database_1 = require("./database");
/**
 * ➕ Thêm người tham gia vào giveaway
 */
async function addParticipant(messageId, userId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT OR IGNORE INTO giveaway_participants (message_id, user_id) VALUES (?, ?)`, [messageId, userId]);
}
/**
 * ❌ Xóa người tham gia khỏi giveaway
 */
async function removeParticipant(messageId, userId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`DELETE FROM giveaway_participants WHERE message_id = ? AND user_id = ?`, [messageId, userId]);
}
/**
 * 🔢 Đếm số lượng người tham gia giveaway
 */
async function countParticipants(messageId) {
    const db = await (0, database_1.initDatabase)();
    const result = await db.get(`SELECT COUNT(*) as total FROM giveaway_participants WHERE message_id = ?`, [messageId]);
    return result?.total ?? 0;
}
/**
 * 🎲 Chọn người thắng ngẫu nhiên từ danh sách người tham gia
 */
async function randomParticipants(messageId, limit) {
    const db = await (0, database_1.initDatabase)();
    const winners = await db.all(`SELECT user_id
     FROM giveaway_participants
     WHERE message_id = ?
     ORDER BY RANDOM()
     LIMIT ?`, [messageId, limit]);
    return winners;
}
/**
 * 📋 Lấy danh sách tất cả người tham gia giveaway
 */
async function getGiveawayParticipants(messageId) {
    const db = await (0, database_1.initDatabase)();
    const participants = await db.all(`SELECT user_id FROM giveaway_participants WHERE message_id = ?`, [messageId]);
    return participants;
}

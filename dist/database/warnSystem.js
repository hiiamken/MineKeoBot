"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnUser = warnUser;
exports.addWarning = addWarning;
exports.getWarnings = getWarnings;
exports.clearWarnings = clearWarnings;
exports.confirmLegitLink = confirmLegitLink;
exports.isLinkConfirmed = isLinkConfirmed;
const database_1 = require("./database");
/**
 * Ghi lại cảnh cáo của một người dùng
 */
async function warnUser(guildId, userId, moderatorId, reason = 'Không có lý do') {
    return await addWarning(guildId, userId, moderatorId, reason);
}
/**
 * Thêm cảnh cáo mới và trả về tổng số cảnh cáo
 */
async function addWarning(guildId, userId, moderatorId, reason = 'Không có lý do') {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, [guildId, userId, moderatorId, reason]);
    const row = await db.get(`SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
    return row ? row.count : 0;
}
/**
 * Lấy danh sách cảnh cáo
 */
async function getWarnings(guildId, userId) {
    const db = await (0, database_1.initDatabase)();
    return db.all(`SELECT reason, timestamp FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC`, [guildId, userId]);
}
/**
 * Xoá toàn bộ cảnh cáo
 */
async function clearWarnings(guildId, userId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`DELETE FROM warnings WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
}
/* -------------------------- LEGIT LINK CONFIRMATION -------------------------- */
/**
 * ✅ Thêm link đã xác nhận hợp lệ từ người dùng
 */
async function confirmLegitLink(userId, link) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT OR REPLACE INTO link_confirmations (user_id, link, confirmed_at) VALUES (?, ?, ?)`, [userId, link, Date.now()]);
}
/**
 * ❓ Kiểm tra xem user đã xác nhận link đó chưa
 */
async function isLinkConfirmed(userId, link) {
    const db = await (0, database_1.initDatabase)();
    const row = await db.get(`SELECT 1 FROM link_confirmations WHERE user_id = ? AND link = ?`, [userId, link]);
    return !!row;
}

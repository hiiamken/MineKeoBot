"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markUserVerified = markUserVerified;
exports.isUserVerified = isUserVerified;
exports.getVerificationTime = getVerificationTime;
exports.removeUserVerification = removeUserVerification;
exports.getAllVerifiedUsers = getAllVerifiedUsers;
const database_1 = require("./database");
/**
 * Ghi nhận rằng người dùng đã xác minh thành công
 * @param userId - ID của người dùng
 */
async function markUserVerified(userId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT OR REPLACE INTO verify_log (user_id, verified_at) VALUES (?, ?)`, [userId, Date.now()]);
}
/**
 * Kiểm tra xem người dùng đã xác minh hay chưa
 * @param userId - ID của người dùng
 * @returns true nếu người dùng đã xác minh, false nếu chưa
 */
async function isUserVerified(userId) {
    const db = await (0, database_1.initDatabase)();
    const result = await db.get(`SELECT * FROM verify_log WHERE user_id = ?`, [userId]);
    return !!result;
}
/**
 * Lấy thời gian xác minh của người dùng
 * @param userId - ID của người dùng
 * @returns Thời gian xác minh (ms) hoặc null nếu chưa xác minh
 */
async function getVerificationTime(userId) {
    const db = await (0, database_1.initDatabase)();
    const result = await db.get(`SELECT verified_at FROM verify_log WHERE user_id = ?`, [userId]);
    return result ? result.verified_at : null;
}
/**
 * Xóa dữ liệu xác minh của người dùng (nếu cần reset)
 * @param userId - ID của người dùng
 */
async function removeUserVerification(userId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`DELETE FROM verify_log WHERE user_id = ?`, [userId]);
}
/**
 * Lấy danh sách tất cả người dùng đã xác minh
 * @returns Mảng người dùng đã xác minh cùng thời gian
 */
async function getAllVerifiedUsers() {
    const db = await (0, database_1.initDatabase)();
    return db.all(`SELECT * FROM verify_log ORDER BY verified_at DESC`);
}

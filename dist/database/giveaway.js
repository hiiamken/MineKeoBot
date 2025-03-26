"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGiveawayNumber = startGiveawayNumber;
exports.getActiveGiveaway = getActiveGiveaway;
exports.getAllOngoingGiveaways = getAllOngoingGiveaways;
exports.updateGiveawayParticipants = updateGiveawayParticipants;
exports.endGiveaway = endGiveaway;
exports.updateGiveawayStatus = updateGiveawayStatus;
exports.rerollWinner = rerollWinner;
exports.getGiveawayByMessageId = getGiveawayByMessageId;
const database_1 = require("./database");
/**
 * 🏆 Tạo Giveaway mới
 */
async function startGiveawayNumber(messageId, guildId, channelId, prize, winnersCount, endTime, hostId = 'unknown', requireRole = '', requireLevel = 0, requireMoney = 0, requireInvite = 0, bonusJSON = '') {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT INTO giveaways (
      message_id, guild_id, channel_id, host_id, prize,
      winners_count, end_time, status,
      require_role, require_level, require_money, require_invite, bonus_roles
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ongoing', ?, ?, ?, ?, ?)`, [
        messageId,
        guildId,
        channelId,
        hostId,
        prize,
        winnersCount,
        endTime,
        requireRole,
        requireLevel,
        requireMoney,
        requireInvite,
        bonusJSON
    ]);
}
/**
 * 🔍 Lấy Giveaway Đang Diễn Ra theo `messageId`
 */
async function getActiveGiveaway(guildId, messageId) {
    const db = await (0, database_1.initDatabase)();
    const result = await db.get(`SELECT * FROM giveaways WHERE guild_id = ? AND message_id = ? AND status = 'ongoing'`, [guildId, messageId]);
    return result;
}
/**
 * 📌 Lấy Tất Cả Giveaway Đang Diễn Ra
 */
async function getAllOngoingGiveaways() {
    const db = await (0, database_1.initDatabase)();
    return db.all(`SELECT * FROM giveaways WHERE status = 'ongoing'`);
}
/**
 * 🛠 Cập Nhật Participants vào Cột `giveaways.participants`
 */
async function updateGiveawayParticipants(guildId, messageId, participants) {
    const db = await (0, database_1.initDatabase)();
    const participantsJSON = JSON.stringify(participants);
    await db.run(`UPDATE giveaways SET participants = ? WHERE guild_id = ? AND message_id = ?`, [participantsJSON, guildId, messageId]);
}
/**
 * ⏳ Kết Thúc Giveaway (Đặt `status = 'ended'`)
 */
async function endGiveaway(guildId, messageId) {
    const db = await (0, database_1.initDatabase)();
    try {
        // ✅ Chỉ thêm cột `participants` nếu chưa tồn tại
        await db.run(`ALTER TABLE giveaways ADD COLUMN participants TEXT DEFAULT '[]'`);
    }
    catch (err) {
        const error = err;
        if (!error.message.includes("duplicate column name")) {
            console.error("❌ Lỗi khi thêm cột participants:", error);
        }
    }
    const participants = await db.all(`SELECT user_id FROM giveaway_participants WHERE message_id = ?`, [messageId]);
    const participantsJSON = JSON.stringify(participants.map(p => p.user_id));
    // 🔹 Cập nhật trạng thái giveaway
    await db.run(`UPDATE giveaways 
     SET status = 'ended', participants = ? 
     WHERE guild_id = ? AND message_id = ?`, [participantsJSON, guildId, messageId]);
}
/**
 * 🔄 Cập Nhật Trạng Thái Giveaway (pause, resume...)
 */
async function updateGiveawayStatus(guildId, messageId, status) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`UPDATE giveaways SET status = ? WHERE guild_id = ? AND message_id = ?`, [status, guildId, messageId]);
}
/**
 * 🎲 Reroll (Chọn Người Thắng Mới Ngẫu Nhiên)
 */
async function rerollWinner(guildId, messageId, winnersCount) {
    const db = await (0, database_1.initDatabase)();
    return db.all(`SELECT user_id FROM giveaway_participants 
     WHERE guild_id = ? AND message_id = ? 
     ORDER BY RANDOM() LIMIT ?`, [guildId, messageId, winnersCount]);
}
/**
 * 🔍 Lấy Giveaway Theo `messageId`
 */
async function getGiveawayByMessageId(guildId, messageId) {
    const db = await (0, database_1.initDatabase)();
    return db.get(`SELECT * FROM giveaways WHERE guild_id = ? AND message_id = ?`, [guildId, messageId]);
}

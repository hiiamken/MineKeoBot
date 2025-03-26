"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserData = getUserData;
const database_1 = require("./database");
async function getUserData(userId, guildId) {
    const db = await (0, database_1.initDatabase)(); // Kết nối database
    // Lấy dữ liệu từ bảng economy
    const user = await db.get(`SELECT economy.money, economy.bank, messages.message_count
FROM economy
LEFT JOIN messages ON economy.user_id = messages.user_id AND economy.guild_id = messages.guild_id
WHERE economy.user_id = ? AND economy.guild_id = ?`, [userId, guildId]);
    if (!user) {
        return {
            userId,
            guildId,
            money: 0, // Số tiền mặc định
            bank: 0, // Tiền trong ngân hàng mặc định
            level: 1, // Level mặc định
            xp: 0, // Kinh nghiệm mặc định
            messages: 0 // Số tin nhắn mặc định
        };
    }
    return user;
}

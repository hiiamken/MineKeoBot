"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleExp = handleExp;
const levelManager_1 = require("../levels/levelManager");
/**
 * Xử lý XP và tin nhắn cho mỗi tin nhắn của người dùng.
 * Mỗi tin nhắn sẽ cộng XP (ví dụ: 5 XP) và tăng count tin nhắn.
 */
async function handleExp(message) {
    if (message.author.bot)
        return;
    const xpToAdd = 5; // Số XP mỗi tin nhắn
    try {
        await (0, levelManager_1.addXp)(message.guild.id, message.author.id, xpToAdd);
        await (0, levelManager_1.addMessageCount)(message.guild.id, message.author.id);
    }
    catch (error) {
        console.error("Lỗi khi cập nhật XP/tin nhắn:", error);
    }
}

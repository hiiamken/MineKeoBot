"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = exports.name = void 0;
exports.execute = execute;
const config_1 = require("../../config/config");
const database_1 = require("../../database/database");
exports.name = 'clear';
exports.description = 'Xóa số lượng tin nhắn cụ thể trong kênh hiện tại.';
async function execute(message, args) {
    if (!message.member || !(0, config_1.hasPermission)(message.member)) {
        return message.channel.send('🚫 Bạn không có quyền sử dụng lệnh này!');
    }
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
        return message.channel.send('⚠ Vui lòng nhập số lượng tin nhắn cần xóa (1 - 100).');
    }
    try {
        const channel = message.channel;
        const messages = await channel.messages.fetch({ limit: amount });
        await channel.bulkDelete(messages, true);
        // Lưu log vi phạm (purge) vào database
        await (0, database_1.logInfraction)(message.guild.id, message.author.id, message.author.id, // Người thực hiện là chính mình
        'purge', `Xóa ${messages.size} tin nhắn`);
        const confirmMessage = await channel.send(`✅ Đã xóa ${messages.size} tin nhắn thành công!`);
        setTimeout(() => confirmMessage.delete(), 5000);
    }
    catch (error) {
        console.error('Lỗi khi xóa tin nhắn:', error);
        message.channel.send('⚠ Đã xảy ra lỗi khi xóa tin nhắn.');
    }
}

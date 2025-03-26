"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const config_1 = require("../config/config");
const commandLoader_1 = require("../handlers/commandLoader");
const adminCommandLoader_1 = require("../handlers/adminCommandLoader");
const expHandler_1 = require("./expHandler");
const automodHandler_1 = require("../events/automodHandler");
async function handleMessage(message) {
    if (message.author.bot || !message.guild)
        return;
    // 🚨 **Kiểm tra Automod trước khi xử lý XP & lệnh**
    const automodHandled = await (0, automodHandler_1.handleAutomod)(message);
    if (automodHandled)
        return; // Nếu Automod xử lý tin nhắn, dừng lại
    // 🌟 **Xử lý XP cho người dùng**
    await (0, expHandler_1.handleExp)(message);
    // ⚡ **Xử lý lệnh Prefix**
    const prefix = (0, config_1.getPrefix)();
    if (!message.content.startsWith(prefix))
        return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName)
        return;
    const prefixCommands = await (0, commandLoader_1.loadPrefixCommands)();
    const adminPrefixCommands = await (0, adminCommandLoader_1.loadAdminPrefixCommands)();
    const command = prefixCommands.get(commandName) || adminPrefixCommands.get(commandName);
    if (!command)
        return;
    try {
        await command.execute(message, args);
    }
    catch (error) {
        console.error(`❌ Lỗi khi thực thi lệnh ${commandName}:`, error);
        if (message.channel.isTextBased()) {
            const channel = message.channel;
            await channel.send('⚠ Đã xảy ra lỗi khi thực thi lệnh!');
        }
    }
}

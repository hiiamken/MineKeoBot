"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAdminPrefixCommands = loadAdminPrefixCommands;
exports.loadAdminSlashCommands = loadAdminSlashCommands;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const discord_js_1 = require("discord.js");
/**
 * Hàm quét và load tất cả admin command trong một thư mục (admin prefix hoặc admin slash) theo cách đệ quy.
 * @param commandsPath Đường dẫn tới thư mục chứa file lệnh admin.
 * @returns Collection<string, any> - (key là command.name hoặc command.data.name)
 */
async function loadAdminCommandsFromDir(commandsPath) {
    const commands = new discord_js_1.Collection();
    if (!fs_1.default.existsSync(commandsPath)) {
        console.warn(`⚠ Thư mục không tồn tại: ${commandsPath}`);
        return commands;
    }
    // Đọc tất cả các entry (file hoặc thư mục) trong thư mục hiện tại
    const entries = fs_1.default.readdirSync(commandsPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(commandsPath, entry.name);
        if (entry.isDirectory()) {
            // Nếu là thư mục, gọi đệ quy để load các file bên trong
            const subCommands = await loadAdminCommandsFromDir(fullPath);
            subCommands.forEach((cmd, key) => {
                commands.set(key, cmd);
            });
        }
        else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
            const fileUrl = (0, url_1.pathToFileURL)(fullPath).href;
            try {
                const commandModule = await import(fileUrl);
                // Tìm đối tượng lệnh có thuộc tính "name" hoặc "data.name"
                let foundCommand = null;
                for (const key of Object.keys(commandModule)) {
                    const candidate = commandModule[key];
                    if (candidate && (candidate.name || candidate.data?.name)) {
                        foundCommand = candidate;
                        break;
                    }
                }
                const commandName = foundCommand?.name || foundCommand?.data?.name;
                if (!foundCommand || !commandName) {
                    console.warn(`⚠ File "${entry.name}" không có thuộc tính "name" (admin command không hợp lệ).`);
                    continue;
                }
                foundCommand.fileName = entry.name;
                commands.set(commandName, foundCommand);
            }
            catch (error) {
                console.error(`❌ [Admin] Lỗi khi import lệnh từ "${entry.name}":`, error);
            }
        }
    }
    return commands;
}
/** Load lệnh admin prefix */
async function loadAdminPrefixCommands() {
    const commandsPath = path_1.default.join(__dirname, '../admincommands/prefix');
    return loadAdminCommandsFromDir(commandsPath);
}
/** Load lệnh admin slash */
async function loadAdminSlashCommands() {
    const commandsPath = path_1.default.join(__dirname, '../admincommands/slash');
    return loadAdminCommandsFromDir(commandsPath);
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPrefixCommands = loadPrefixCommands;
exports.loadSlashCommands = loadSlashCommands;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const discord_js_1 = require("discord.js");
/**
 * Hàm quét và load tất cả command trong một thư mục (prefix hoặc slash).
 * @param commandsPath Đường dẫn tới thư mục chứa file lệnh
 * @returns Collection<string, any> - (key là command.name hoặc command.data.name)
 */
async function loadCommandsFromDir(commandsPath) {
    const commands = new discord_js_1.Collection();
    // Kiểm tra thư mục
    if (!fs_1.default.existsSync(commandsPath)) {
        console.warn(`⚠ Thư mục không tồn tại: ${commandsPath}`);
        return commands;
    }
    // Lọc file .js hoặc .ts
    const commandFiles = fs_1.default
        .readdirSync(commandsPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    for (const file of commandFiles) {
        const filePath = path_1.default.join(commandsPath, file);
        const fileUrl = (0, url_1.pathToFileURL)(filePath).href;
        try {
            const commandModule = await import(fileUrl);
            // Tìm đối tượng lệnh (named export) có thuộc tính "name" hoặc "data.name"
            let foundCommand = null;
            for (const key of Object.keys(commandModule)) {
                const candidate = commandModule[key];
                if (candidate && (candidate.name || candidate.data?.name)) {
                    foundCommand = candidate;
                    break;
                }
            }
            // Kiểm tra
            const commandName = foundCommand?.name || foundCommand?.data?.name;
            if (!foundCommand || !commandName) {
                console.warn(`⚠ File "${file}" không có thuộc tính "name" (command không hợp lệ).`);
                continue;
            }
            // Lưu vào Collection
            foundCommand.fileName = file;
            commands.set(commandName, foundCommand);
        }
        catch (error) {
            console.error(`❌ Lỗi khi import lệnh từ "${file}":`, error);
        }
    }
    return commands;
}
/** Load lệnh prefix thường */
async function loadPrefixCommands() {
    const commandsPath = path_1.default.join(__dirname, '../commands/prefix');
    return loadCommandsFromDir(commandsPath);
}
/** Load lệnh slash thường */
async function loadSlashCommands() {
    const commandsPath = path_1.default.join(__dirname, '../commands/slash');
    return loadCommandsFromDir(commandsPath);
}

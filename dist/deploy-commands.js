"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const url_1 = require("url");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Tự động quét và load tất cả các lệnh slash từ thư mục được chỉ định (đệ quy).
 * @param dir Đường dẫn đến thư mục chứa các file lệnh slash.
 * @returns Mảng các lệnh dưới dạng JSON (đã gọi .toJSON())
 */
async function loadSlashCommandsFromDir(dir) {
    const commands = [];
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Nếu là thư mục, gọi đệ quy để load các file bên trong
            const subCommands = await loadSlashCommandsFromDir(fullPath);
            commands.push(...subCommands);
        }
        else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
            const fileUrl = (0, url_1.pathToFileURL)(fullPath).href;
            const commandModule = await import(fileUrl);
            // Kiểm tra export
            let command = commandModule.default || commandModule;
            if (command.data && command.data.name) {
                commands.push(command.data.toJSON());
            }
            else {
                // Nếu không có default export, duyệt qua từng key
                for (const key in commandModule) {
                    const cmd = commandModule[key];
                    if (cmd && cmd.data && cmd.data.name) {
                        commands.push(cmd.data.toJSON());
                    }
                }
            }
        }
    }
    return commands;
}
async function main() {
    // Thay đổi đường dẫn này theo cấu trúc dự án của bạn
    const normalCommandsDir = path_1.default.join(__dirname, 'commands/slash');
    const adminCommandsDir = path_1.default.join(__dirname, 'admincommands/slash');
    // Quét và load tất cả lệnh slash
    const normalCommands = await loadSlashCommandsFromDir(normalCommandsDir);
    const adminCommands = await loadSlashCommandsFromDir(adminCommandsDir);
    const allCommands = [...normalCommands, ...adminCommands];
    // Tạo REST instance
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    // Đăng ký lệnh dưới dạng Guild Commands cho server cụ thể
    const guildId = '1096684955045728328'; // Thay ID server của bạn ở đây
    try {
        console.log(`\n🚀 Đang đăng ký tất cả lệnh mới trên server ${guildId}...`);
        const registeredCommands = await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: allCommands });
        console.log('✅ Đăng ký thành công! Các lệnh đã đăng ký:');
        if (Array.isArray(registeredCommands)) {
            console.table(registeredCommands.map((cmd) => ({
                Name: cmd.name,
                ID: cmd.id,
                Description: cmd.description,
            })));
        }
        else {
            console.log(registeredCommands);
        }
    }
    catch (error) {
        console.error('❌ Lỗi khi đăng ký lệnh Guild:', error);
    }
}
main();

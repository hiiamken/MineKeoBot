"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBotCommand = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Lệnh /checkbot, chỉ dành cho Admin.
 */
exports.checkBotCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('checkbot')
        .setDescription('🔍 Kiểm tra dữ liệu của bot: uptime, dung lượng database, ping, RAM')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator), // Chỉ Admin
    async execute(interaction) {
        // 1) Tính uptime
        const uptimeSeconds = process.uptime(); // số giây bot đã chạy
        const uptimeString = formatUptime(uptimeSeconds);
        // 2) Lấy dung lượng database.sqlite
        let dbSize = 'Không xác định';
        try {
            // Đảm bảo path.resolve tới đúng file DB của bạn
            const dbPath = path_1.default.resolve(process.cwd(), 'database.sqlite');
            const stats = fs_1.default.statSync(dbPath);
            dbSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
        }
        catch (err) {
            console.error('[CHECKBOT] Không lấy được dung lượng database:', err);
        }
        // 3) Ping của bot
        const ping = interaction.client.ws.ping; // ms
        // 4) RAM usage (đang dùng)
        const usedMemoryBytes = process.memoryUsage().rss; // RAM bot đang chiếm
        const usedMemoryMB = (usedMemoryBytes / (1024 * 1024)).toFixed(2) + ' MB';
        // Tạo embed hiển thị
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setTitle('🤖 Thông tin Bot')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/4712/4712027.png') // Đổi link icon nếu muốn
            .addFields({ name: 'Uptime', value: uptimeString, inline: false }, { name: 'Database', value: dbSize, inline: false }, { name: 'Ping', value: `${ping} ms`, inline: false }, { name: 'RAM', value: usedMemoryMB, inline: false })
            .setFooter({ text: 'Thông tin cập nhật từ bot' });
        // Gửi tin nhắn ephemeral (chỉ admin thấy)
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
/**
 * Chuyển số giây thành chuỗi "x giờ y phút z giây"
 */
function formatUptime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
}

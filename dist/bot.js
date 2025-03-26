"use strict";
// src/bot.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.adminSlashCommandsCollection = exports.slashCommandsCollection = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const activityUtils_1 = require("./utils/activityUtils");
const commandLoader_1 = require("./handlers/commandLoader");
const adminCommandLoader_1 = require("./handlers/adminCommandLoader");
const guildMemberAdd_1 = require("./events/guildMemberAdd");
const guildMemberRemove_1 = require("./events/guildMemberRemove");
const messageCreate_1 = require("./events/messageCreate");
const interactionCreate_1 = require("./events/interactionCreate");
const database_1 = require("./database/database");
const giveawayReaction_1 = require("./events/giveawayReaction");
const cli_table3_1 = __importDefault(require("cli-table3"));
const backupManager_1 = require("./automod/backupManager");
const antiRaid_1 = require("./automod/antiRaid");
const reactionRoleAutoRefresh_1 = require("./handlers/reactionRoleAutoRefresh");
// IMPORT các event Anti-Nuke và Panic Mode
const antiNukeEvents_1 = require("./events/antiNukeEvents");
const panicModeEvents_1 = require("./events/panicModeEvents");
// IMPORT Reaction Role events
const reactionRoleEvents_1 = require("./events/reactionRoleEvents");
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
        discord_js_1.GatewayIntentBits.GuildIntegrations
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Reaction, discord_js_1.Partials.User, discord_js_1.Partials.Channel]
});
exports.client = client;
exports.slashCommandsCollection = new discord_js_1.Collection();
exports.adminSlashCommandsCollection = new discord_js_1.Collection();
client.once('ready', async () => {
    console.log(`✅ Bot đã đăng nhập thành công với tên: ${client.user.tag}`);
    // 🔄 Fetch owner để đảm bảo kiểm tra quyền chính xác
    await client.application?.fetch();
    try {
        const db = await (0, database_1.initDatabase)();
        console.log("✅ Database đã được khởi tạo thành công.");
    }
    catch (error) {
        console.error("❌ Lỗi khi khởi tạo database:", error);
    }
    (0, activityUtils_1.setRandomActivity)(client);
    setInterval(() => (0, activityUtils_1.setRandomActivity)(client), 1800000);
    setInterval(() => {
        (0, reactionRoleAutoRefresh_1.autoRefreshReactionRoleEmbeds)().catch(console.error);
    }, 10 * 60 * 1000); // Mỗi 10 phút
    const prefixCommands = await (0, commandLoader_1.loadPrefixCommands)();
    const slashCommands = await (0, commandLoader_1.loadSlashCommands)();
    const adminPrefixCommands = await (0, adminCommandLoader_1.loadAdminPrefixCommands)();
    const adminSlashCommands = await (0, adminCommandLoader_1.loadAdminSlashCommands)();
    slashCommands.forEach((cmd, name) => exports.slashCommandsCollection.set(name, cmd));
    adminSlashCommands.forEach((cmd, name) => exports.adminSlashCommandsCollection.set(name, cmd));
    console.log("\n📜 DANH SÁCH LẬNH CỦA BOT 📜\n");
    function displayCommandTable(title, commands) {
        console.log(`\n📌 ${title}`);
        if (commands.length > 0) {
            const table = new cli_table3_1.default({
                head: ['Name', 'Description', 'File'],
                colWidths: [20, 50, 30],
                wordWrap: true,
                style: { head: ['cyan'], border: ['grey'] }
            });
            commands.forEach(cmd => {
                table.push([cmd.Name, cmd.Description, cmd.File]);
            });
            console.log(table.toString());
        }
        else {
            console.log("(Không có lệnh nào)");
        }
    }
    const userPrefixCommands = Array.from(prefixCommands.values()).map(cmd => ({
        Name: cmd?.name || 'N/A',
        Description: cmd?.description || 'Không có mô tả',
        File: cmd?.fileName || 'Không có file',
    }));
    const userSlashCommands = Array.from(slashCommands.values()).map(cmd => ({
        Name: cmd?.data?.name || 'N/A',
        Description: cmd?.data?.description || '❌ Không có mô tả',
        File: cmd?.fileName || 'Không có file',
    }));
    const adminPrefixCmds = Array.from(adminPrefixCommands.values()).map(cmd => ({
        Name: cmd?.name || 'N/A',
        Description: cmd?.description || 'Không có mô tả',
        File: cmd?.fileName || 'Không có file',
    }));
    const adminSlashCmds = Array.from(adminSlashCommands.values()).map(cmd => ({
        Name: cmd?.data?.name || 'N/A',
        Description: cmd?.data?.description || '❌ Không có mô tả',
        File: cmd?.fileName || 'Không có file',
    }));
    console.log("\n💡 === LẬNH NGƯỞI DÙNG === 💡");
    displayCommandTable("📌 PREFIX COMMANDS", userPrefixCommands);
    displayCommandTable("📌 SLASH COMMANDS", userSlashCommands);
    console.log("\n🔧 === LẬNH ADMIN === 🔧");
    displayCommandTable("📌 ADMIN PREFIX COMMANDS", adminPrefixCmds);
    displayCommandTable("📌 ADMIN SLASH COMMANDS", adminSlashCmds);
    // ✅ Tự động backup định kỳ cho toàn bộ guild khi bot khởi động
    for (const guild of client.guilds.cache.values()) {
        // Ví dụ: nếu cài đặt autoBackup = 1, gọi setBackupInterval
        // const autoBackup = await getGuildAutoBackup(guild.id);
        // if (autoBackup === 1) {
        //   setBackupInterval(guild, 30, 100);
        // }
    }
});
client.on('guildCreate', guild => {
    (0, backupManager_1.setBackupInterval)(guild, 30, 50);
});
client.on('guildMemberAdd', async (member) => {
    await (0, guildMemberAdd_1.onGuildMemberAdd)(member); // sự kiện cũ
    await (0, antiRaid_1.handleAntiRaidJoin)(member); // sự kiện chống RAID mới
});
client.on('guildMemberRemove', async (member) => {
    if (member.partial) {
        try {
            member = await member.fetch();
        }
        catch (error) {
            console.error("❌ Không thể lấy dữ liệu member:", error);
            return;
        }
    }
    await (0, guildMemberRemove_1.onGuildMemberRemove)(member);
});
client.on('messageCreate', messageCreate_1.handleMessage);
client.on('interactionCreate', interactionCreate_1.handleInteraction);
// Đăng ký các sự kiện Giveaway
(0, giveawayReaction_1.registerGiveawayReactions)(client);
(0, giveawayReaction_1.registerGiveawayAutoEnd)(client);
// Đăng ký các sự kiện Anti-Nuke và Panic Mode
client.on('channelCreate', async (channel) => {
    await (0, antiNukeEvents_1.onChannelCreate)(channel);
    await (0, panicModeEvents_1.onChannelCreate)(channel);
});
client.on('channelDelete', async (channel) => {
    await (0, antiNukeEvents_1.onChannelDelete)(channel);
    await (0, panicModeEvents_1.onChannelDelete)(channel);
});
client.on('roleCreate', async (role) => {
    await (0, antiNukeEvents_1.onRoleCreate)(role);
    await (0, panicModeEvents_1.onRoleCreate)(role);
});
client.on('roleDelete', async (role) => {
    await (0, antiNukeEvents_1.onRoleDelete)(role);
    await (0, panicModeEvents_1.onRoleDelete)(role);
});
client.on('guildBanAdd', async (ban) => {
    await (0, antiNukeEvents_1.onGuildBanAdd)(ban);
    await (0, panicModeEvents_1.onGuildBanAdd)(ban);
});
client.on('messageReactionAdd', async (reaction, user) => {
    // Xử lý reaction partial
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (err) {
            console.error('Không thể fetch reaction:', err);
            return;
        }
    }
    // Xử lý user partial
    if (user.partial) {
        try {
            await user.fetch();
        }
        catch (err) {
            console.error('Không thể fetch user:', err);
            return;
        }
    }
    // Giờ reaction đã là full MessageReaction, user đã là full User
    // Ép kiểu
    await (0, reactionRoleEvents_1.onMessageReactionAdd)(reaction, user);
});
client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (err) {
            console.error('Không thể fetch reaction:', err);
            return;
        }
    }
    if (user.partial) {
        try {
            await user.fetch();
        }
        catch (err) {
            console.error('Không thể fetch user:', err);
            return;
        }
    }
    await (0, reactionRoleEvents_1.onMessageReactionRemove)(reaction, user);
});
client.login(process.env.DISCORD_TOKEN);

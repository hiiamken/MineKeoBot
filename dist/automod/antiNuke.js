"use strict";
// src/automod/antinuke.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditEventsToMonitor = void 0;
exports.monitorAuditEvent = monitorAuditEvent;
const discord_js_1 = require("discord.js");
const securityConfig_1 = __importDefault(require("../config/securityConfig"));
const quarantineUtils_1 = require("./quarantineUtils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../database/database");
const riskScore_1 = require("./riskScore");
const panicMode_1 = require("./panicMode");
const actionCounter = new Map();
const webhookCreateCounter = new Map();
const WEBHOOK_SPAM_LIMIT = 5;
const WEBHOOK_SPAM_WINDOW_MS = 30 * 1000;
// Bản đồ risk score cho từng loại AuditLogEvent
const riskScoreMap = {
    [discord_js_1.AuditLogEvent.ChannelCreate]: 1,
    [discord_js_1.AuditLogEvent.ChannelDelete]: 5,
    [discord_js_1.AuditLogEvent.RoleCreate]: 2,
    [discord_js_1.AuditLogEvent.RoleDelete]: 5,
    [discord_js_1.AuditLogEvent.MemberBanAdd]: 4,
    [discord_js_1.AuditLogEvent.WebhookCreate]: 3,
    [discord_js_1.AuditLogEvent.WebhookDelete]: 4,
    [discord_js_1.AuditLogEvent.MemberKick]: 3,
    [discord_js_1.AuditLogEvent.RoleUpdate]: 2,
    [discord_js_1.AuditLogEvent.WebhookUpdate]: 2,
    [discord_js_1.AuditLogEvent.EmojiUpdate]: 1,
    [discord_js_1.AuditLogEvent.StickerUpdate]: 1,
    [discord_js_1.AuditLogEvent.MemberUpdate]: 1,
    [discord_js_1.AuditLogEvent.GuildUpdate]: 5,
    [discord_js_1.AuditLogEvent.ChannelOverwriteUpdate]: 2
};
// Hàm tiện ích để xác định mức cảnh báo dựa trên risk score
function getAlertLevel(totalScore) {
    const levels = securityConfig_1.default.antiNuke.alertLevels;
    if (totalScore >= levels.emergency) {
        return 'emergency';
    }
    else if (totalScore >= levels.critical) {
        return 'critical';
    }
    else if (totalScore >= levels.warning) {
        return 'warning';
    }
    return null;
}
async function monitorAuditEvent(guild, eventType) {
    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: eventType });
        const entry = auditLogs.entries.first();
        if (!entry)
            return;
        const executor = entry.executor;
        const target = entry.target;
        if (!executor || executor.bot)
            return;
        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (!member)
            return;
        // Kiểm tra whitelist
        const hasBypass = securityConfig_1.default.antiNuke.whitelistedUsers.includes(executor.id) ||
            member.roles.cache.some(role => securityConfig_1.default.antiNuke.whitelistedRoles.includes(role.id)) ||
            member.permissions.has(discord_js_1.PermissionsBitField.Flags.Administrator) ||
            executor.id === guild.ownerId;
        if (hasBypass)
            return;
        const key = `${guild.id}-${executor.id}`;
        const count = (actionCounter.get(key) || 0) + 1;
        actionCounter.set(key, count);
        // Thêm risk score theo event
        const baseScore = riskScoreMap[eventType] || 2;
        await (0, riskScore_1.addRiskScore)(guild.id, executor.id, baseScore);
        // Các hành động khác: log behavior, gửi cảnh báo, restore, quarantine, snapshot, v.v.
        await logBehavior(guild, executor, eventType, count, target);
        await sendAntiNukeAlert(guild, executor, eventType, count, target);
        // Xử lý webhook spam và restore nếu cần (giữ nguyên)
        // Kiểm tra tổng risk score
        const totalScore = await (0, riskScore_1.getRiskScore)(guild.id, executor.id) ?? 0;
        const alertLevel = getAlertLevel(totalScore);
        console.log(`[AntiNuke] ${executor.tag} có risk score ${totalScore}, alert level: ${alertLevel}`);
        // Phản ứng theo mức alert:
        if (alertLevel === 'warning') {
            // Chỉ gửi cảnh báo, log thêm (hoặc tăng risk score)
            console.warn(`[AntiNuke] [WARNING] ${executor.tag} có hành vi khả nghi, nhưng chưa vượt ngưỡng Critical.`);
        }
        else if (alertLevel === 'critical') {
            // Có thể quarantine người dùng
            console.warn(`[AntiNuke] [CRITICAL] ${executor.tag} vượt ngưỡng Critical.`);
            await (0, quarantineUtils_1.quarantineUser)(guild, executor.id);
        }
        else if (alertLevel === 'emergency') {
            // Hành động cấp bách: ban người dùng, kích hoạt Panic Mode, restore backup, …
            console.warn(`[AntiNuke] [EMERGENCY] ${executor.tag} vượt ngưỡng Emergency.`);
            await member.ban({ reason: `Anti-Nuke: Risk Score quá cao (${totalScore})` }).catch(() => { });
        }
        await (0, panicMode_1.maybeTriggerPanicByRisk)(guild, executor.id);
        await (0, panicMode_1.maybeTriggerPanicByRapidEvents)(guild, executor.id);
    }
    catch (error) {
        console.error('[AntiNuke] ❌ Lỗi khi xử lý audit event:', error);
    }
}
async function sendAntiNukeAlert(guild, executor, event, count, target) {
    const logChannelId = securityConfig_1.default.restore?.logChannelId;
    const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;
    if (!logChannel || !logChannel.isTextBased())
        return;
    // Lấy risk score hiện tại
    const totalScore = await (0, riskScore_1.getRiskScore)(guild.id, executor.id) ?? 0;
    const fields = [
        { name: 'Số lượng hành động', value: `${count}`, inline: true },
        { name: 'Điểm rủi ro hiện tại', value: `${totalScore}`, inline: true }
    ];
    if (target?.id) {
        fields.push({
            name: 'Đối tượng bị ảnh hưởng',
            value: `${target.name || target.id}`,
            inline: true
        });
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('Orange')
        .setTitle('⚠️ Hành vi nguy hiểm được phát hiện')
        .setDescription(`${executor.tag} (${executor.id}) đã thực hiện hành động **${discord_js_1.AuditLogEvent[event]}**.`)
        .addFields(fields)
        .setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => { });
    try {
        const owner = await guild.fetchOwner();
        if (owner) {
            await owner.send({
                content: `🚨 **CẢNH BÁO ANTI-NUKE**: ${executor.tag} vừa thực hiện hành vi nguy hiểm: **${discord_js_1.AuditLogEvent[event]}** tại server ${guild.name}.`
            }).catch(() => { });
        }
    }
    catch (err) {
        console.warn('[AntiNuke] Không gửi được DM tới owner:', err);
    }
}
async function logBehavior(guild, user, event, count, target) {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${user.tag} (${user.id}) thực hiện ${discord_js_1.AuditLogEvent[event]} - Count: ${count}`;
    console.log('[AuditLog]', log);
    const logDir = path_1.default.join(__dirname, '../logs');
    if (!fs_1.default.existsSync(logDir))
        fs_1.default.mkdirSync(logDir);
    const logPath = path_1.default.join(logDir, `antinuke_${guild.id}.log`);
    fs_1.default.appendFileSync(logPath, log + '\n');
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT INTO antinuke_logs (guild_id, user_id, username, event, target, count, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        guild.id,
        user.id,
        user.tag,
        discord_js_1.AuditLogEvent[event],
        target?.id || '',
        count,
        timestamp
    ]);
}
exports.auditEventsToMonitor = [
    discord_js_1.AuditLogEvent.ChannelCreate,
    discord_js_1.AuditLogEvent.ChannelDelete,
    discord_js_1.AuditLogEvent.RoleCreate,
    discord_js_1.AuditLogEvent.RoleDelete,
    discord_js_1.AuditLogEvent.MemberBanAdd,
    discord_js_1.AuditLogEvent.WebhookCreate,
    discord_js_1.AuditLogEvent.WebhookDelete,
    discord_js_1.AuditLogEvent.MemberKick,
    discord_js_1.AuditLogEvent.RoleUpdate,
    discord_js_1.AuditLogEvent.WebhookUpdate,
    discord_js_1.AuditLogEvent.EmojiUpdate,
    discord_js_1.AuditLogEvent.StickerUpdate,
    discord_js_1.AuditLogEvent.MemberUpdate,
    discord_js_1.AuditLogEvent.GuildUpdate,
    discord_js_1.AuditLogEvent.ChannelOverwriteUpdate
];

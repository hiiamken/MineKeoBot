"use strict";
// src/automod/backupManager.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShortBackupId = generateShortBackupId;
exports.createBackup = createBackup;
exports.createBackupWithProgress = createBackupWithProgress;
exports.cleanupOldBackups = cleanupOldBackups;
exports.setBackupInterval = setBackupInterval;
exports.clearBackupInterval = clearBackupInterval;
exports.createMinimalSnapshotBackup = createMinimalSnapshotBackup;
const discord_js_1 = require("discord.js");
const database_1 = require("../database/database");
// ===== QUAY VỀ DÙNG fs & promisify =====
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
// Chuyển các hàm callback -> promise
const mkdirAsync = (0, util_1.promisify)(fs_1.default.mkdir);
const readdirAsync = (0, util_1.promisify)(fs_1.default.readdir);
const statAsync = (0, util_1.promisify)(fs_1.default.stat);
const unlinkAsync = (0, util_1.promisify)(fs_1.default.unlink);
const accessAsync = (0, util_1.promisify)(fs_1.default.access);
const readFileAsync = (0, util_1.promisify)(fs_1.default.readFile);
const writeFileAsync = (0, util_1.promisify)(fs_1.default.writeFile);
// =======================================
const backupUltis_1 = require("./backupUltis");
const updateSecurityConfig_1 = require("../utils/updateSecurityConfig");
const MAX_BACKUP_FILES = 25;
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
const backupIntervals = new Map();
/**
 * Tạo chuỗi backupId ngắn gọn, dạng "YYYYMMDD_HHMM_RAND".
 */
function generateShortBackupId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${y}${m}${d}_${hh}${mm}_${rand}`;
}
/**
 * Tạo backup cho server (KHÔNG cập nhật progress).
 */
async function createBackup(guild, messageCount) {
    const prefix = (guild.id === '1096684955045728328') ? 'MineKeo' : 'Unknown';
    const backupId = `${prefix}_${generateShortBackupId()}`;
    // Thực hiện backup
    await (0, backupUltis_1.backupRoles)(guild, backupId);
    await (0, backupUltis_1.backupChannelsStructure)(guild, backupId);
    await (0, backupUltis_1.backupMessages)(guild, backupId, messageCount);
    await (0, backupUltis_1.backupThreads)(guild, backupId);
    await (0, backupUltis_1.backupForumPosts)(guild, backupId);
    await (0, backupUltis_1.backupNicknames)(guild, backupId);
    await (0, backupUltis_1.backupRoleAssignments)(guild, backupId);
    await (0, backupUltis_1.backupBans)(guild, backupId);
    await (0, backupUltis_1.backupWebhooks)(guild, backupId);
    await (0, backupUltis_1.backupEmojis)(guild, backupId);
    await (0, backupUltis_1.backupIntegrations)(guild, backupId);
    // Xuất file JSON
    const filePath = await (0, backupUltis_1.exportBackupToJson)(guild.id, backupId);
    console.log(`[Backup] ✅ Hoàn tất backup cho guild ${guild.id} với ID: ${backupId}`);
    await (0, updateSecurityConfig_1.updateSecurityConfig)({
        antiNuke: {
            lockdown: { lastBackupId: backupId }
        }
    });
    // Đếm kênh/role để báo cáo
    const db = await (0, database_1.initDatabase)();
    const channelCountRow = await db.get(`SELECT COUNT(*) as total FROM channels WHERE backup_id = ?`, [backupId]);
    const roleCountRow = await db.get(`SELECT COUNT(*) as total FROM roles WHERE backup_id = ?`, [backupId]);
    const channelCount = channelCountRow?.total ?? 0;
    const roleCount = roleCountRow?.total ?? 0;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`📦 Đã tạo backup: \`${backupId}\``)
        .setColor('Blue')
        .addFields({ name: 'Guild ID', value: guild.id, inline: true }, { name: 'Channels', value: channelCount.toString(), inline: true }, { name: 'Roles', value: roleCount.toString(), inline: true })
        .setFooter({ text: `Thời gian: ${new Date().toLocaleString('vi-VN')}` });
    // Gửi embed + file backup
    const logChannelId = '1096806362060705904';
    const logChannel = guild.channels.cache.get(logChannelId || '');
    const owner = await guild.fetchOwner().catch(() => null);
    let files = [];
    try {
        await accessAsync(filePath);
        const fileName = path_1.default.basename(filePath);
        const fileBuffer = await readFileAsync(filePath);
        files.push({ attachment: fileBuffer, name: fileName });
    }
    catch (err) {
        console.warn(`[Backup] File backup không tồn tại: ${filePath}`, err);
    }
    if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed], files }).catch(() => null);
    }
    else if (owner) {
        await owner.send({ embeds: [embed], files }).catch(() => null);
    }
    return backupId;
}
/**
 * Tạo backup với cập nhật progress.
 */
async function createBackupWithProgress(guild, messageCount, progressCallback) {
    const prefix = (guild.id === '1096684955045728328') ? 'MineKeo' : 'Unknown';
    const backupId = `${prefix}_${generateShortBackupId()}`;
    const steps = [
        { name: 'Roles', func: backupUltis_1.backupRoles },
        { name: 'Channels', func: backupUltis_1.backupChannelsStructure },
        { name: 'Messages', func: backupUltis_1.backupMessages },
        { name: 'Threads', func: backupUltis_1.backupThreads },
        { name: 'ForumPosts', func: backupUltis_1.backupForumPosts },
        { name: 'Nicknames', func: backupUltis_1.backupNicknames },
        { name: 'RoleAssignments', func: backupUltis_1.backupRoleAssignments },
        { name: 'Bans', func: backupUltis_1.backupBans },
        { name: 'Webhooks', func: backupUltis_1.backupWebhooks },
        { name: 'Emojis', func: backupUltis_1.backupEmojis },
        { name: 'Integrations', func: backupUltis_1.backupIntegrations }
    ];
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const progress = Math.round(((i + 1) / steps.length) * 100);
        if (progressCallback) {
            await progressCallback(progress, `Đang backup ${step.name}...`);
        }
        try {
            if (step.name === 'Messages') {
                await step.func(guild, backupId, messageCount);
            }
            else {
                await step.func(guild, backupId);
            }
        }
        catch (error) {
            console.error(`[Backup] Lỗi khi backup ${step.name}:`, error);
            if (progressCallback) {
                await progressCallback(progress, `Lỗi khi backup ${step.name}`);
            }
        }
    }
    const filePath = await (0, backupUltis_1.exportBackupToJson)(guild.id, backupId);
    console.log(`[Backup] ✅ Hoàn tất backup cho guild ${guild.id} với ID: ${backupId}`);
    await (0, updateSecurityConfig_1.updateSecurityConfig)({
        antiNuke: {
            lockdown: { lastBackupId: backupId }
        }
    });
    if (progressCallback) {
        await progressCallback(100, `Backup hoàn tất: ${backupId}`);
    }
    return backupId;
}
/**
 * Xoá backup cũ (cũ hơn 7 ngày, hoặc vượt quá MAX_BACKUP_FILES).
 */
async function cleanupOldBackups(guildId) {
    const backupDir = path_1.default.join(process.cwd(), 'backups');
    try {
        await accessAsync(backupDir);
    }
    catch (err) {
        return;
    }
    let files = await readdirAsync(backupDir);
    files = files.filter(file => file.startsWith(guildId) && file.endsWith('.json'));
    const fileStats = await Promise.all(files.map(async (file) => {
        const filePath = path_1.default.join(backupDir, file);
        const stats = await statAsync(filePath);
        return { file, mtime: stats.mtime.getTime() };
    }));
    const now = Date.now();
    const oldFiles = fileStats.filter(f => now - f.mtime > SEVEN_DAYS_IN_MS);
    for (const f of oldFiles) {
        try {
            await unlinkAsync(path_1.default.join(backupDir, f.file));
            console.log(`[Cleanup] Deleted backup file (older than 7 days): ${f.file}`);
        }
        catch (err) {
            console.warn(`[Cleanup] Error deleting file ${f.file}:`, err);
        }
    }
    let remainingFiles = await readdirAsync(backupDir);
    remainingFiles = remainingFiles.filter(file => file.startsWith(guildId) && file.endsWith('.json'));
    const remainingStats = await Promise.all(remainingFiles.map(async (file) => {
        const filePath = path_1.default.join(backupDir, file);
        const stats = await statAsync(filePath);
        return { file, mtime: stats.mtime.getTime() };
    }));
    remainingStats.sort((a, b) => b.mtime - a.mtime);
    if (remainingStats.length > MAX_BACKUP_FILES) {
        const excessFiles = remainingStats.slice(MAX_BACKUP_FILES);
        for (const f of excessFiles) {
            try {
                await unlinkAsync(path_1.default.join(backupDir, f.file));
                console.log(`[Cleanup] Deleted excess backup file: ${f.file}`);
            }
            catch (err) {
                console.warn(`[Cleanup] Error deleting excess file ${f.file}:`, err);
            }
        }
    }
}
/**
 * Đặt interval tự động backup.
 */
function setBackupInterval(guild, intervalMinutes, messageCount) {
    if (backupIntervals.has(guild.id)) {
        clearInterval(backupIntervals.get(guild.id));
    }
    const intervalMs = intervalMinutes * 60_000;
    const handle = setInterval(() => {
        console.log(`[Backup] Tự động backup cho guild ${guild.id}`);
        createBackup(guild, messageCount).catch(console.error);
    }, intervalMs);
    backupIntervals.set(guild.id, handle);
}
function clearBackupInterval(guildId) {
    const handle = backupIntervals.get(guildId);
    if (handle) {
        clearInterval(handle);
        backupIntervals.delete(guildId);
    }
}
async function createMinimalSnapshotBackup(guild) {
    const snapshotId = `snapshot_${Date.now()}`;
    // Backup các thành phần tối thiểu (roles, channels, webhooks) 
    await (0, backupUltis_1.backupRoles)(guild, snapshotId);
    await (0, backupUltis_1.backupChannelsStructure)(guild, snapshotId);
    await (0, backupUltis_1.backupWebhooks)(guild, snapshotId);
    await (0, backupUltis_1.exportBackupToJson)(guild.id, snapshotId);
    console.log(`[Backup] 📊 Snapshot nhanh (tối thiểu) đã được tạo: ${snapshotId}`);
    return snapshotId;
}

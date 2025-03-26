"use strict";
// src/automod/panicMode.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enablePanicMode = enablePanicMode;
exports.disablePanicMode = disablePanicMode;
exports.isPanicModeActive = isPanicModeActive;
exports.freezeUser = freezeUser;
exports.unfreezeUser = unfreezeUser;
exports.unfreezeAllUsers = unfreezeAllUsers;
exports.maybeTriggerPanicByRisk = maybeTriggerPanicByRisk;
exports.maybeTriggerPanicByRapidEvents = maybeTriggerPanicByRapidEvents;
exports.rollbackPanic = rollbackPanic;
const discord_js_1 = require("discord.js");
const securityConfig_1 = __importDefault(require("../config/securityConfig"));
const riskScore_1 = require("./riskScore");
const restoreManager_1 = require("./restoreManager");
const panicModeGuilds = new Set();
const panicSnapshotMap = new Map(); // Lưu snapshot ID cho mỗi guild
const recentActions = new Map(); // [timestamp, timestamp, ...]
const PANIC_DURATION_MS = 15 * 60 * 1000;
const AUTO_PANIC_ACTION_THRESHOLD = 4;
const ACTION_WINDOW_MS = 30 * 1000;
/**
 * Bật Panic Mode cho guild.
 * @param guild server
 * @param triggeredBy ID người kích hoạt (có thể là user.id)
 */
async function enablePanicMode(guild, triggeredBy) {
    if (panicModeGuilds.has(guild.id))
        return;
    panicModeGuilds.add(guild.id);
    // Thông báo kênh log
    const logChannel = getLogChannel(guild);
    if (logChannel) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('Red')
            .setTitle('🛑 Panic Mode Đã Bật')
            .setDescription(`Panic Mode được kích hoạt bởi <@${triggeredBy}>.`)
            .setFooter({ text: `Guild ID: ${guild.id}` })
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
    // Freeze tất cả user (trừ bot, owner, admin)
    for (const member of guild.members.cache.values()) {
        if (member.user.bot ||
            member.id === guild.ownerId ||
            member.permissions.has('Administrator'))
            continue;
        await freezeUser(guild, member.id);
    }
    // (Tuỳ chọn) Tạo snapshot backup nhanh
    // Nếu bạn muốn rollback, có thể lưu snapshotId
    // const snapshotId = await createMinimalSnapshotBackup(guild);
    // panicSnapshotMap.set(guild.id, snapshotId);
    // Tự động tắt sau X ms (nếu có cấu hình)
    const autoDisableMs = securityConfig_1.default.antiNuke?.panicMode?.autoDisableAfterMs || PANIC_DURATION_MS;
    setTimeout(() => {
        disablePanicMode(guild, 'System (Timeout)');
    }, autoDisableMs);
}
/**
 * Tắt Panic Mode cho guild (thủ công hoặc tự động).
 */
async function disablePanicMode(guild, triggeredBy) {
    if (!panicModeGuilds.has(guild.id))
        return;
    panicModeGuilds.delete(guild.id);
    const logChannel = getLogChannel(guild);
    if (logChannel) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Panic Mode Đã Tắt')
            .setDescription(`Panic Mode được tắt bởi: ${triggeredBy}`)
            .setFooter({ text: `Guild ID: ${guild.id}` })
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
    // Mở khóa (unfreeze) tất cả user đã bị freeze
    await unfreezeAllUsers(guild);
    // (Nếu có snapshot, có thể xóa hoặc rollback tuỳ logic)
    // panicSnapshotMap.delete(guild.id);
}
/**
 * Kiểm tra guild có đang ở Panic Mode hay không.
 */
function isPanicModeActive(guildId) {
    return panicModeGuilds.has(guildId);
}
/**
 * Freeze 1 user bằng cách gán họ vào role "Frozen".
 */
async function freezeUser(guild, userId) {
    try {
        const member = await guild.members.fetch(userId);
        if (!member)
            return;
        const freezeRole = await getOrCreateFreezeRole(guild);
        await member.roles.add(freezeRole, 'Panic Mode: Freeze user nghi ngờ');
        console.log(`[PanicMode] Đã freeze user ${member.user.tag}`);
    }
    catch (err) {
        console.error(`[PanicMode] Lỗi khi freeze user ${userId}:`, err);
    }
}
/**
 * Unfreeze 1 user (gỡ role "Frozen").
 */
async function unfreezeUser(guild, userId) {
    try {
        const member = await guild.members.fetch(userId);
        if (!member)
            return;
        const freezeRole = await getOrCreateFreezeRole(guild);
        if (member.roles.cache.has(freezeRole.id)) {
            await member.roles.remove(freezeRole, 'Panic Mode: Unfreeze user');
            console.log(`[PanicMode] Đã unfreeze user ${member.user.tag}`);
        }
    }
    catch (err) {
        console.error(`[PanicMode] Lỗi khi unfreeze user ${userId}:`, err);
    }
}
/**
 * Unfreeze toàn bộ user trong server.
 */
async function unfreezeAllUsers(guild) {
    const freezeRole = await getOrCreateFreezeRole(guild);
    for (const member of guild.members.cache.values()) {
        if (member.roles.cache.has(freezeRole.id)) {
            await member.roles.remove(freezeRole, 'Panic Mode: Unfreeze all');
        }
    }
    console.log(`[PanicMode] Đã unfreeze tất cả user trong server ${guild.name}.`);
}
/**
 * Tạo (hoặc lấy) role "Frozen" để freeze user.
 */
async function getOrCreateFreezeRole(guild) {
    const roleName = securityConfig_1.default.antiNuke?.panicMode?.freezeRoleName || 'Frozen';
    let role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
        role = await guild.roles.create({
            name: roleName,
            permissions: [],
            reason: 'Panic Mode: Tạo role freeze'
        });
        console.log(`[PanicMode] Đã tạo role "${roleName}" cho server ${guild.name}.`);
    }
    return role;
}
/**
 * Lấy kênh log nếu có cấu hình.
 */
function getLogChannel(guild) {
    const channelId = securityConfig_1.default.restore?.logChannelId;
    const channel = guild.channels.cache.get(channelId || '');
    return (channel && channel.isTextBased()) ? channel : null;
}
/**
 * Khi phát hiện hành vi nguy hiểm, gọi hàm này để kích hoạt Panic Mode theo risk score.
 */
async function maybeTriggerPanicByRisk(guild, userId) {
    const score = await (0, riskScore_1.getRiskScore)(guild.id, userId);
    if (score >= 30 && !isPanicModeActive(guild.id)) {
        await enablePanicMode(guild, userId);
    }
}
/**
 * Khi phát hiện nhiều hành động liên tiếp, gọi hàm này để kích hoạt Panic Mode.
 */
async function maybeTriggerPanicByRapidEvents(guild, userId) {
    const now = Date.now();
    const key = `${guild.id}-${userId}`;
    const list = recentActions.get(key) || [];
    // Lọc các event cũ hơn ACTION_WINDOW_MS
    const updated = [...list.filter(t => now - t <= ACTION_WINDOW_MS), now];
    recentActions.set(key, updated);
    // Nếu số event liên tiếp >= AUTO_PANIC_ACTION_THRESHOLD => bật Panic Mode
    if (updated.length >= AUTO_PANIC_ACTION_THRESHOLD && !isPanicModeActive(guild.id)) {
        await enablePanicMode(guild, userId);
        recentActions.set(key, []); // reset sau khi kích hoạt
    }
}
/**
 * Hàm rollbackPanic cho phép khôi phục server về snapshot
 * đã được tạo khi bật Panic Mode (nếu có).
 */
async function rollbackPanic(guild) {
    // Giả sử bạn có map panicSnapshotMap: Map<string, string> lưu snapshot ID
    if (!panicSnapshotMap.has(guild.id)) {
        console.warn(`[PanicMode] Không có snapshot để rollback cho guild ${guild.name}.`);
        return;
    }
    const snapshotId = panicSnapshotMap.get(guild.id);
    console.log(`[PanicMode] Rollback server ${guild.name} về snapshot ${snapshotId}`);
    await (0, restoreManager_1.restoreFull)(guild, snapshotId);
    // Sau khi rollback, có thể xoá snapshot khỏi map
    panicSnapshotMap.delete(guild.id);
}

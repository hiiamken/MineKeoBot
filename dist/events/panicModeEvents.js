"use strict";
// src/events/panicModeEvents.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.onChannelCreate = onChannelCreate;
exports.onChannelDelete = onChannelDelete;
exports.onRoleCreate = onRoleCreate;
exports.onRoleDelete = onRoleDelete;
exports.onGuildBanAdd = onGuildBanAdd;
const discord_js_1 = require("discord.js");
const panicMode_1 = require("../automod/panicMode");
/**
 * Khi một kênh được tạo, kiểm tra Panic Mode.
 */
function onChannelCreate(channel) {
    if (channel.type === discord_js_1.ChannelType.DM || channel.type === discord_js_1.ChannelType.GroupDM)
        return;
    if (!channel.guild)
        return;
    // Thay vì "await checkPanicMode", ta chỉ cần gọi isPanicModeActive nếu muốn biết đang bật/tắt
    const active = (0, panicMode_1.isPanicModeActive)(channel.guild.id);
    // Bạn có thể thêm logic tùy ý, ví dụ:
    // if (active) { ... } else { ... }
}
/**
 * Khi một kênh bị xóa, kiểm tra Panic Mode.
 */
function onChannelDelete(channel) {
    if (channel.type === discord_js_1.ChannelType.DM || channel.type === discord_js_1.ChannelType.GroupDM)
        return;
    if (!channel.guild)
        return;
    const active = (0, panicMode_1.isPanicModeActive)(channel.guild.id);
    // Tùy logic
}
/**
 * Khi một role được tạo, kiểm tra Panic Mode.
 */
function onRoleCreate(role) {
    if (!role.guild)
        return;
    const active = (0, panicMode_1.isPanicModeActive)(role.guild.id);
    // Tùy logic
}
/**
 * Khi một role bị xóa, kiểm tra Panic Mode.
 */
function onRoleDelete(role) {
    if (!role.guild)
        return;
    const active = (0, panicMode_1.isPanicModeActive)(role.guild.id);
    // Tùy logic
}
/**
 * Khi một thành viên bị ban, kiểm tra Panic Mode.
 */
function onGuildBanAdd(ban) {
    if (!ban.guild)
        return;
    const active = (0, panicMode_1.isPanicModeActive)(ban.guild.id);
    // Tùy logic
}

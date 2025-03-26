"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onChannelCreate = onChannelCreate;
exports.onChannelDelete = onChannelDelete;
exports.onRoleCreate = onRoleCreate;
exports.onRoleDelete = onRoleDelete;
exports.onGuildBanAdd = onGuildBanAdd;
const discord_js_1 = require("discord.js");
const antiNuke_1 = require("../automod/antiNuke");
/**
 * Khi một kênh được tạo, kiểm tra Anti-Nuke.
 */
async function onChannelCreate(channel) {
    if (channel.type === discord_js_1.ChannelType.DM || channel.type === discord_js_1.ChannelType.GroupDM)
        return;
    if (!channel.guild)
        return;
    await (0, antiNuke_1.monitorAuditEvent)(channel.guild, discord_js_1.AuditLogEvent.ChannelCreate);
}
/**
 * Khi một kênh bị xóa, kiểm tra Anti-Nuke.
 */
async function onChannelDelete(channel) {
    if (channel.type === discord_js_1.ChannelType.DM || channel.type === discord_js_1.ChannelType.GroupDM)
        return;
    if (!channel.guild)
        return;
    await (0, antiNuke_1.monitorAuditEvent)(channel.guild, discord_js_1.AuditLogEvent.ChannelDelete);
}
/**
 * Khi một role được tạo, kiểm tra Anti-Nuke.
 */
async function onRoleCreate(role) {
    if (!role.guild)
        return;
    await (0, antiNuke_1.monitorAuditEvent)(role.guild, discord_js_1.AuditLogEvent.RoleCreate);
}
/**
 * Khi một role bị xóa, kiểm tra Anti-Nuke.
 */
async function onRoleDelete(role) {
    if (!role.guild)
        return;
    await (0, antiNuke_1.monitorAuditEvent)(role.guild, discord_js_1.AuditLogEvent.RoleDelete);
}
/**
 * Khi một thành viên bị ban, kiểm tra Anti-Nuke.
 */
async function onGuildBanAdd(ban) {
    if (!ban.guild)
        return;
    await (0, antiNuke_1.monitorAuditEvent)(ban.guild, discord_js_1.AuditLogEvent.MemberBanAdd);
}

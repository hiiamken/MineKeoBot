"use strict";
// src/automod/quarantineUtils.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quarantineUser = quarantineUser;
const securityConfig_1 = __importDefault(require("../config/securityConfig"));
/**
 * Áp dụng cách ly cho người dùng bị nghi nuke.
 */
async function quarantineUser(guild, userId) {
    try {
        const member = await guild.members.fetch(userId);
        if (!member)
            return;
        let quarantineRole = guild.roles.cache.find(role => role.name === securityConfig_1.default.antiNuke.quarantineRoleName);
        if (!quarantineRole) {
            quarantineRole = await guild.roles.create({
                name: securityConfig_1.default.antiNuke.quarantineRoleName,
                permissions: [],
                reason: 'Anti-Nuke: Tạo role cách ly'
            });
        }
        await member.roles.set([quarantineRole.id], 'Anti-Nuke: Cách ly do vượt ngưỡng hành vi nguy hiểm');
        console.log(`[AntiNuke] ✅ Đã cách ly ${member.user.tag} (${member.id})`);
    }
    catch (error) {
        console.error('[AntiNuke] ❌ Lỗi khi cách ly người dùng:', error);
    }
}

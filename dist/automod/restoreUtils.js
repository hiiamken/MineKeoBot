"use strict";
// src/automod/restoreUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreRoles = restoreRoles;
exports.restoreChannels = restoreChannels;
exports.restoreChannelPermissions = restoreChannelPermissions;
exports.restoreNicknames = restoreNicknames;
exports.restoreRoleAssignments = restoreRoleAssignments;
exports.restoreBans = restoreBans;
exports.restoreMessages = restoreMessages;
exports.restoreThreads = restoreThreads;
exports.restoreEmojis = restoreEmojis;
exports.restoreWebhooks = restoreWebhooks;
exports.restoreIntegrations = restoreIntegrations;
const discord_js_1 = require("discord.js");
const database_1 = require("../database/database");
async function restoreRoles(guild, backupId) {
    const db = await (0, database_1.initDatabase)();
    const roles = await db.all(`SELECT * FROM roles WHERE guild_id = ? AND backup_id = ? ORDER BY position DESC`, [guild.id, backupId]);
    for (const role of roles) {
        const existing = guild.roles.cache.get(role.id);
        if (!existing) {
            await guild.roles.create({
                name: role.name,
                color: role.color,
                permissions: BigInt(role.permissions),
                hoist: !!role.hoist,
                mentionable: !!role.mentionable,
                reason: 'Restore from backup'
            });
        }
    }
}
async function restoreChannels(guild, backupId) {
    const db = await (0, database_1.initDatabase)();
    // Lấy dữ liệu kênh từ backup (không lọc theo guild_id vì khi clone sang server khác, guild_id khác nhau)
    const backupChannels = await db.all(`SELECT * FROM channels WHERE backup_id = ? ORDER BY position ASC`, [backupId]);
    // Tạo danh sách tên các kênh có trong backup
    const backupNames = backupChannels.map((ch) => ch.name);
    console.log(`[RestoreChannels] Backup channels: ${backupNames.join(', ')}`);
    // Xóa các kênh hiện tại mà tên không nằm trong danh sách backup.
    // (Cẩn trọng: Hành động này sẽ xóa tất cả các kênh "không có trong backup", hãy đảm bảo bạn đang test trên server an toàn)
    for (const channel of guild.channels.cache.values()) {
        // Bạn có thể thêm điều kiện để không xóa kênh bot dùng (ví dụ: kênh nơi lệnh được gọi, kênh log,...)
        if (!backupNames.includes(channel.name)) {
            try {
                await channel.delete('Restore: Channel không có trong backup');
                console.log(`[RestoreChannels] Đã xoá kênh: ${channel.name}`);
            }
            catch (err) {
                console.error(`[RestoreChannels] Lỗi khi xoá kênh ${channel.name}:`, err);
            }
        }
    }
    // Tạo lại các kênh từ backup nếu chưa tồn tại (so sánh theo tên)
    for (const ch of backupChannels) {
        // Kiểm tra nếu có kênh nào có cùng tên
        const exists = guild.channels.cache.find((channel) => channel.name === ch.name);
        if (!exists) {
            try {
                await guild.channels.create({
                    name: ch.name,
                    type: Number(ch.type), // Đảm bảo chuyển đổi sang số nếu cần
                    parent: ch.parent_id ? ch.parent_id : undefined,
                    position: ch.position,
                    reason: 'Restore from backup'
                });
                console.log(`[RestoreChannels] Đã tạo kênh: ${ch.name}`);
            }
            catch (err) {
                console.error(`[RestoreChannels] Lỗi khi tạo kênh ${ch.name}:`, err);
            }
        }
        else {
            console.log(`[RestoreChannels] Kênh ${ch.name} đã tồn tại, bỏ qua.`);
        }
    }
}
async function restoreChannelPermissions(guild, backupId) {
    const db = await (0, database_1.initDatabase)();
    // Lấy danh sách permission overwrites từ DB
    const rows = await db.all(`
    SELECT channel_id, target_id, target_type, allow, deny
    FROM channel_permissions
    WHERE backup_id = ? AND guild_id = ?
  `, [backupId, guild.id]);
    for (const perm of rows) {
        const channel = guild.channels.cache.get(perm.channel_id);
        // Kiểm tra channel tồn tại
        if (!channel || !('permissionOverwrites' in channel)) {
            continue; // skip
        }
        // Chuyển allow, deny từ string sang BigInt
        const allowBits = BigInt(perm.allow);
        const denyBits = BigInt(perm.deny);
        try {
            await channel.permissionOverwrites.edit(perm.target_id, {
                allow: allowBits,
                deny: denyBits
            }, {
                type: perm.target_type === 'role' ? discord_js_1.OverwriteType.Role : discord_js_1.OverwriteType.Member,
                reason: 'Khôi phục permissionOverwrites từ backup'
            });
            console.log(`Đã áp permissionOverwrites cho channel ${channel.id}, target ${perm.target_id}`);
        }
        catch (err) {
            console.warn(`Không áp được permissionOverwrites cho channel ${channel.id}`, err);
        }
    }
}
async function restoreNicknames(guild, backupId) {
    const db = await (0, database_1.initDatabase)();
    const rows = await db.all(`SELECT * FROM nicknames WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
    for (const row of rows) {
        const member = await guild.members.fetch(row.user_id).catch(() => null);
        if (member)
            await member.setNickname(row.nickname, 'Restore from backup');
    }
}
async function restoreRoleAssignments(guild, backupId) {
    const db = await (0, database_1.initDatabase)();
    const rows = await db.all(`SELECT * FROM role_assignments WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
    for (const row of rows) {
        const member = await guild.members.fetch(row.user_id).catch(() => null);
        if (member && !member.roles.cache.has(row.role_id)) {
            await member.roles.add(row.role_id, 'Restore from backup');
        }
    }
}
async function restoreBans(guild, backupId) {
    const db = await (0, database_1.initDatabase)();
    const rows = await db.all(`SELECT * FROM bans WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
    for (const row of rows) {
        const exists = await guild.bans.fetch(row.user_id).catch(() => null);
        if (!exists) {
            await guild.members.ban(row.user_id, { reason: row.reason || 'Restore from backup' });
        }
    }
}
async function restoreMessages(_, __) {
    console.log('[Restore] ⚠️ Cannot restore messages via bot due to Discord API limitations.');
}
async function restoreThreads(_, __) {
    console.log('[Restore] ⚠️ Cannot restore threads via bot due to Discord API limitations.');
}
async function restoreEmojis(_, __) {
    console.log('[Restore] ⚠️ Cannot restore emojis via bot due to Discord API limitations.');
}
async function restoreWebhooks(_, __) {
    console.log('[Restore] ⚠️ Cannot restore webhooks via bot due to Discord API limitations.');
}
async function restoreIntegrations(_, __) {
    console.log('[Restore] ⚠️ Cannot restore integrations via bot due to Discord API limitations.');
}

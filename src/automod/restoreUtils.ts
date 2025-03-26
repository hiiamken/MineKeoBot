// src/automod/restoreUtils.ts

import { Guild, OverwriteType } from 'discord.js';
import { initDatabase } from '../database/database';
import config from '../config/securityConfig';
import { client } from '../bot';

export async function restoreRoles(guild: Guild, backupId: string) {
  const db = await initDatabase();
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

export async function restoreChannels(guild: Guild, backupId: string) {
  const db = await initDatabase();
  
  // Lấy dữ liệu kênh từ backup (không lọc theo guild_id vì khi clone sang server khác, guild_id khác nhau)
  const backupChannels = await db.all(
    `SELECT * FROM channels WHERE backup_id = ? ORDER BY position ASC`,
    [backupId]
  );
  
  // Tạo danh sách tên các kênh có trong backup
  const backupNames = backupChannels.map((ch: any) => ch.name);
  
  console.log(`[RestoreChannels] Backup channels: ${backupNames.join(', ')}`);
  
  // Xóa các kênh hiện tại mà tên không nằm trong danh sách backup.
  // (Cẩn trọng: Hành động này sẽ xóa tất cả các kênh "không có trong backup", hãy đảm bảo bạn đang test trên server an toàn)
  for (const channel of guild.channels.cache.values()) {
    // Bạn có thể thêm điều kiện để không xóa kênh bot dùng (ví dụ: kênh nơi lệnh được gọi, kênh log,...)
    if (!backupNames.includes(channel.name)) {
      try {
        await channel.delete('Restore: Channel không có trong backup');
        console.log(`[RestoreChannels] Đã xoá kênh: ${channel.name}`);
      } catch (err) {
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
      } catch (err) {
        console.error(`[RestoreChannels] Lỗi khi tạo kênh ${ch.name}:`, err);
      }
    } else {
      console.log(`[RestoreChannels] Kênh ${ch.name} đã tồn tại, bỏ qua.`);
    }
  }
}

export async function restoreChannelPermissions(guild: Guild, backupId: string) {
  const db = await initDatabase();

  // Lấy danh sách permission overwrites từ DB
  const rows = await db.all<{
    channel_id: string;
    target_id: string;
    target_type: string;
    allow: string;
    deny: string;
  }[]>(`
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
      await (channel as any).permissionOverwrites.edit(
        perm.target_id,
        {
          allow: allowBits,
          deny: denyBits
        },
        {
          type: perm.target_type === 'role' ? OverwriteType.Role : OverwriteType.Member,
          reason: 'Khôi phục permissionOverwrites từ backup'
        }
      );
      console.log(`Đã áp permissionOverwrites cho channel ${channel.id}, target ${perm.target_id}`);
    } catch (err) {
      console.warn(`Không áp được permissionOverwrites cho channel ${channel.id}`, err);
    }
  }
}

export async function restoreNicknames(guild: Guild, backupId: string) {
  const db = await initDatabase();
  const rows = await db.all(`SELECT * FROM nicknames WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
  for (const row of rows) {
    const member = await guild.members.fetch(row.user_id).catch(() => null);
    if (member) await member.setNickname(row.nickname, 'Restore from backup');
  }
}

export async function restoreRoleAssignments(guild: Guild, backupId: string) {
  const db = await initDatabase();
  const rows = await db.all(`SELECT * FROM role_assignments WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
  for (const row of rows) {
    const member = await guild.members.fetch(row.user_id).catch(() => null);
    if (member && !member.roles.cache.has(row.role_id)) {
      await member.roles.add(row.role_id, 'Restore from backup');
    }
  }
}

export async function restoreBans(guild: Guild, backupId: string) {
  const db = await initDatabase();
  const rows = await db.all(`SELECT * FROM bans WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
  for (const row of rows) {
    const exists = await guild.bans.fetch(row.user_id).catch(() => null);
    if (!exists) {
      await guild.members.ban(row.user_id, { reason: row.reason || 'Restore from backup' });
    }
  }
}

export async function restoreMessages(_: Guild, __: string) {
  console.log('[Restore] ⚠️ Cannot restore messages via bot due to Discord API limitations.');
}

export async function restoreThreads(_: Guild, __: string) {
  console.log('[Restore] ⚠️ Cannot restore threads via bot due to Discord API limitations.');
}

export async function restoreEmojis(_: Guild, __: string) {
  console.log('[Restore] ⚠️ Cannot restore emojis via bot due to Discord API limitations.');
}

export async function restoreWebhooks(_: Guild, __: string) {
  console.log('[Restore] ⚠️ Cannot restore webhooks via bot due to Discord API limitations.');
}

export async function restoreIntegrations(_: Guild, __: string) {
  console.log('[Restore] ⚠️ Cannot restore integrations via bot due to Discord API limitations.');
}

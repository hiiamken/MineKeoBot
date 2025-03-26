// src/automod/backupUtils.ts

import {
    Guild,
    TextChannel,
    NewsChannel,
    GuildChannel,
    ChannelType,
    OverwriteType
  } from 'discord.js';
  import { initDatabase } from '../database/database';
  import config from '../config/securityConfig';
  import * as fs from 'fs';
  import * as path from 'path';
  import crypto from 'crypto';

  const BACKUP_FOLDER = path.join(process.cwd(), 'backups');
  
  export function generateBackupId(): string {
    const now = new Date();
    return now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  }
  
  /**
 * Xuất dữ liệu backup ra file .json.
 * Tính checksum (SHA256) cho toàn bộ nội dung backup và lưu vào backupInfo.
 * @param guildId ID của server.
 * @param backupId ID của backup.
 * @returns Đường dẫn file backup đã tạo.
 */
export async function exportBackupToJson(guildId: string, backupId: string): Promise<string> {
  const db = await initDatabase();
  const tables = [
    'roles',
    'channels',
    'nicknames',
    'bans',
    'messages_backup',
    'emojis',
    'webhooks',
    'integrations',
    'forum_posts',
    'threads'
  ];
  const result: Record<string, any> = {};

  // Lấy dữ liệu từ từng bảng backup
  for (const table of tables) {
    const rows = await db.all(`SELECT * FROM ${table} WHERE guild_id = ? AND backup_id = ?`, [guildId, backupId]);
    result[table] = rows;
  }

  // Thêm metadata backupInfo
  result.backupInfo = {
    backup_id: backupId,
    guild_id: guildId,
    created_at: new Date().toISOString()
  };

  // Tạo chuỗi JSON để tính checksum
  const jsonString = JSON.stringify(result, null, 2);
  const checksum = crypto.createHash('sha256').update(jsonString).digest('hex');
  result.backupInfo.checksum = checksum;

  // Tạo lại chuỗi JSON với checksum đã cập nhật
  const finalJson = JSON.stringify(result, null, 2);

  // Đường dẫn tới thư mục backup
  const folderPath = path.join(process.cwd(), 'backups');

  // Tạo thư mục backups (sử dụng callback-style và chuyển sang promise)
  await new Promise<void>((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Xác định đường dẫn file backup
  const filePath = path.join(folderPath, `${backupId}.json`);

  // Ghi file backup (sử dụng callback-style và chuyển sang promise)
  await new Promise<void>((resolve, reject) => {
    fs.writeFile(filePath, finalJson, { encoding: 'utf8' }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log(`[Backup] Đã xuất file backup tại: ${filePath}`);
  return filePath;
}
  
  
  export async function backupRoles(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const now = new Date().toISOString();
    const roles = guild.roles.cache.filter(r => r.name !== '@everyone');
  
    for (const role of roles.values()) {
      await db.run(
        `INSERT OR REPLACE INTO roles (backup_id, id, guild_id, name, color, permissions, position, hoist, mentionable, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          role.id,
          guild.id,
          role.name,
          role.color,
          role.permissions.bitfield.toString(),
          role.position,
          role.hoist ? 1 : 0,
          role.mentionable ? 1 : 0,
          now
        ]
      );
    }
  }
  
  export async function backupRoleAssignments(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const now = new Date().toISOString();
    const members = await guild.members.fetch();
  
    for (const member of members.values()) {
      if (member.user.bot) continue;
      for (const role of member.roles.cache.values()) {
        if (role.name === '@everyone') continue;
        await db.run(
          `INSERT INTO role_assignments (backup_id, guild_id, user_id, role_id, assigned_at)
           VALUES (?, ?, ?, ?, ?)`,
          [backupId, guild.id, member.id, role.id, now]
        );
      }
    }
  }
  
  export async function backupNicknames(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const now = new Date().toISOString();
    const members = await guild.members.fetch();
  
    for (const member of members.values()) {
      if (!member.nickname) continue;
      await db.run(
        `INSERT OR REPLACE INTO nicknames (backup_id, guild_id, user_id, nickname, changed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [backupId, guild.id, member.id, member.nickname, now]
      );
    }
  }
  
  export async function backupBans(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const bans = await guild.bans.fetch();
    const now = new Date().toISOString();
  
    for (const ban of bans.values()) {
      await db.run(
        `INSERT OR REPLACE INTO bans (backup_id, guild_id, user_id, reason, banned_at)
         VALUES (?, ?, ?, ?, ?)`,
        [backupId, guild.id, ban.user.id, ban.reason || 'Không rõ', now]
      );
    }
  }

export async function backupChannelsStructure(guild: Guild, backupId: string) {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const channels = guild.channels.cache;

  for (const channel of channels.values()) {
    if (channel instanceof GuildChannel) {
      const parentId = channel.parentId ?? null;
      const position = channel.position ?? 0;
      const createdAt = channel.createdAt?.toISOString() ?? now;

      // Ghi thông tin kênh
      await db.run(
        `INSERT OR REPLACE INTO channels 
         (backup_id, id, guild_id, name, type, parent_id, position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          channel.id,
          guild.id,
          channel.name,
          channel.type,
          parentId,
          position,
          createdAt
        ]
      );

      // Ghi permission overwrites
      for (const overwrite of channel.permissionOverwrites.cache.values()) {
        await db.run(
          `INSERT OR REPLACE INTO channel_permissions
           (backup_id, guild_id, channel_id, target_id, target_type, allow, deny)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            backupId,
            guild.id,
            channel.id,
            overwrite.id,
            overwrite.type === OverwriteType.Role ? 'role' : 'member',
            overwrite.allow.bitfield.toString(),
            overwrite.deny.bitfield.toString()
          ]
        );
      }
    }
  }
}
  
export async function backupMessages(guild: Guild, backupId: string, messageCount?: number): Promise<void> {
  const db = await initDatabase();
  // Giới hạn số tin nhắn tối đa là 100
  const limit = messageCount ? Math.min(messageCount, 100) : 50;
  
  const textChannels = guild.channels.cache.filter(channel =>
    channel instanceof TextChannel || channel instanceof NewsChannel
  );

  for (const channel of textChannels.values()) {
    try {
      // Sử dụng limit không vượt quá 100
      const messages = await channel.messages.fetch({ limit });
      for (const message of messages.values()) {
        // Ví dụ: backup thông tin tin nhắn (tùy chỉnh theo logic của bạn)
        await db.run(
          `INSERT OR REPLACE INTO messages_backup (backup_id, id, guild_id, channel_id, user_id, content, attachments, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            backupId,
            message.id,
            guild.id,
            channel.id,
            message.author.id,
            message.content,
            JSON.stringify([...message.attachments.values()].map(att => att.url)),
            message.createdAt.toISOString()
          ]
        );
      }
    } catch (error) {
      console.warn(`[BackupManager] ❌ Lỗi backup tin nhắn ở channel ${channel.id}:`, error);
    }
  }
}
  
  export async function backupThreads(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const now = new Date().toISOString();
    const threadsData = await guild.channels.fetchActiveThreads();
  
    for (const thread of threadsData.threads.values()) {
      if (thread.isThread()) {
        await db.run(
          `INSERT OR REPLACE INTO threads (backup_id, id, guild_id, channel_id, name, created_at, archived)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            backupId,
            thread.id,
            guild.id,
            thread.parentId,
            thread.name,
            thread.createdAt?.toISOString() ?? now,
            thread.archived ? 1 : 0
          ]
        );
      }
    }
  }
  
  export async function backupForumPosts(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const forumChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum);
  
    for (const forum of forumChannels.values()) {
      const threads = await forum.threads.fetchActive();
      for (const thread of threads.threads.values()) {
        const messages = await thread.messages.fetch({ limit: 50 });
        for (const msg of messages.values()) {
          await db.run(
            `INSERT OR REPLACE INTO forum_posts (backup_id, id, guild_id, channel_id, user_id, content, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              backupId,
              msg.id,
              guild.id,
              thread.id,
              msg.author.id,
              msg.content,
              msg.createdAt.toISOString()
            ]
          );
        }
      }
    }
  }
  
  export async function backupWebhooks(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const channels = guild.channels.cache;
  
    for (const channel of channels.values()) {
      if (
        (channel instanceof TextChannel || channel instanceof NewsChannel) &&
        channel.viewable
      ) {
        try {
          const webhooks = await channel.fetchWebhooks();
          for (const hook of webhooks.values()) {
            await db.run(
              `INSERT OR REPLACE INTO webhooks (backup_id, id, guild_id, channel_id, name, type, token)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                backupId,
                hook.id,
                guild.id,
                channel.id,
                hook.name,
                hook.type,
                hook.token ?? ''
              ]
            );
          }
        } catch (err) {
          console.warn(`[BackupManager] Không thể fetch webhook cho channel ${channel.id}:`, err);
        }
      }
    }
  }
  
  export async function backupEmojis(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const emojis = guild.emojis.cache;
  
    for (const emoji of emojis.values()) {
      await db.run(
        `INSERT OR REPLACE INTO emojis (backup_id, id, guild_id, name, animated, url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          emoji.id,
          guild.id,
          emoji.name,
          emoji.animated ? 1 : 0,
          emoji.url
        ]
      );
    }
  }
  
  export async function backupIntegrations(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const integrations = await guild.fetchIntegrations();
  
    for (const integration of integrations.values()) {
      await db.run(
        `INSERT OR REPLACE INTO integrations (backup_id, id, guild_id, name, type, enabled)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          integration.id,
          guild.id,
          integration.name,
          integration.type,
          integration.enabled ? 1 : 0
        ]
      );
    }
  }

  // Quản lý backup database

  export async function listBackups(): Promise<Array<{
    id: string;
    guildId: string;
    timestamp: number;
    date: string;
  }>> {
    const files = await fs.promises.readdir(BACKUP_FOLDER);
    const results = [];
  
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
  
      const filePath = path.join(BACKUP_FOLDER, file);
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
  
      // Lấy backupId từ tên file
      const backupId = file.replace('.json', '');
  
      // Lấy guildId, created_at từ backupInfo
      const guildId = data.backupInfo?.guild_id || 'Unknown';
      const dateStr = data.backupInfo?.created_at || ''; // "2025-03-24T10:21:10.358Z"
      const dateObj = new Date(dateStr);
      // Kiểm tra hợp lệ
      const finalDate = dateObj.toString() !== 'Invalid Date'
        ? dateObj.toLocaleString('vi-VN')
        : 'Invalid Date';
  
      results.push({
        id: backupId,
        guildId,
        timestamp: dateObj.getTime() || 0,
        date: finalDate
      });
    }
  
    return results;
  }
  
  export async function deleteBackup(guild: Guild, backupId: string) {
    const db = await initDatabase();
    const tables = [
      'roles', 'role_assignments', 'nicknames', 'bans', 'channels',
      'channel_permissions', 'messages_backup', 'threads',
      'forum_posts', 'webhooks', 'emojis', 'integrations'
    ];
  
    for (const table of tables) {
      await db.run(`DELETE FROM ${table} WHERE guild_id = ? AND backup_id = ?`, [guild.id, backupId]);
    }
  
    console.log(`[BackupUtils] Đã xóa backup ${backupId} cho guild ${guild.id}`);
  }
  
  export async function getBackupIdSuggestions(): Promise<string[]> {
    const files = await fs.promises.readdir(BACKUP_FOLDER);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .slice(0, 25); // giới hạn Discord
  }
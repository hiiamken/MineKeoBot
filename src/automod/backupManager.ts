// src/automod/backupManager.ts

import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { initDatabase } from '../database/database';
import config from '../config/securityConfig';
import { client } from '../bot';

// ===== QUAY VỀ DÙNG fs & promisify =====
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Chuyển các hàm callback -> promise
const mkdirAsync = promisify(fs.mkdir);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const unlinkAsync = promisify(fs.unlink);
const accessAsync = promisify(fs.access);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// =======================================
import {
  backupRoles,
  backupChannelsStructure,
  backupMessages,
  backupThreads,
  backupForumPosts,
  backupNicknames,
  backupRoleAssignments,
  backupBans,
  backupWebhooks,
  backupEmojis,
  backupIntegrations,
  exportBackupToJson
} from './backupUltis';
import { updateSecurityConfig } from '../utils/updateSecurityConfig';

const MAX_BACKUP_FILES = 25;
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
const backupIntervals: Map<string, NodeJS.Timeout> = new Map(); 

interface BackupFileStat {
  file: string;
  mtime: number;
}

/**
 * Tạo chuỗi backupId ngắn gọn, dạng "YYYYMMDD_HHMM_RAND".
 */
export function generateShortBackupId(): string {
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
export async function createBackup(guild: Guild, messageCount?: number): Promise<string> {
  const prefix = (guild.id === '1096684955045728328') ? 'MineKeo' : 'Unknown';
  const backupId = `${prefix}_${generateShortBackupId()}`;

  // Thực hiện backup
  await backupRoles(guild, backupId);
  await backupChannelsStructure(guild, backupId);
  await backupMessages(guild, backupId, messageCount);
  await backupThreads(guild, backupId);
  await backupForumPosts(guild, backupId);
  await backupNicknames(guild, backupId);
  await backupRoleAssignments(guild, backupId);
  await backupBans(guild, backupId);
  await backupWebhooks(guild, backupId);
  await backupEmojis(guild, backupId);
  await backupIntegrations(guild, backupId);

  // Xuất file JSON
  const filePath = await exportBackupToJson(guild.id, backupId);
  console.log(`[Backup] ✅ Hoàn tất backup cho guild ${guild.id} với ID: ${backupId}`);

  await updateSecurityConfig({
    antiNuke: {
      lockdown: { lastBackupId: backupId }
    }
  });

  // Đếm kênh/role để báo cáo
  const db = await initDatabase();
  const channelCountRow = await db.get<{ total: number }>(
    `SELECT COUNT(*) as total FROM channels WHERE backup_id = ?`,
    [backupId]
  );
  const roleCountRow = await db.get<{ total: number }>(
    `SELECT COUNT(*) as total FROM roles WHERE backup_id = ?`,
    [backupId]
  );
  const channelCount = channelCountRow?.total ?? 0;
  const roleCount = roleCountRow?.total ?? 0;

  const embed = new EmbedBuilder()
    .setTitle(`📦 Đã tạo backup: \`${backupId}\``)
    .setColor('Blue')
    .addFields(
      { name: 'Guild ID', value: guild.id, inline: true },
      { name: 'Channels', value: channelCount.toString(), inline: true },
      { name: 'Roles', value: roleCount.toString(), inline: true }
    )
    .setFooter({ text: `Thời gian: ${new Date().toLocaleString('vi-VN')}` });

  // Gửi embed + file backup
  const logChannelId = '1096806362060705904'; 
  const logChannel = guild.channels.cache.get(logChannelId || '');
  const owner = await guild.fetchOwner().catch(() => null);

  let files: { attachment: Buffer | string; name: string }[] = [];
  try {
    await accessAsync(filePath);
    const fileName = path.basename(filePath);
    const fileBuffer = await readFileAsync(filePath);
    files.push({ attachment: fileBuffer, name: fileName });
  } catch (err) {
    console.warn(`[Backup] File backup không tồn tại: ${filePath}`, err);
  }
  if (logChannel && logChannel.isTextBased()) {
    await (logChannel as TextChannel).send({ embeds: [embed], files }).catch(() => null);
  } else if (owner) {
    await owner.send({ embeds: [embed], files }).catch(() => null);
  }

  return backupId;
}

/**
 * Tạo backup với cập nhật progress.
 */
export async function createBackupWithProgress(
  guild: Guild,
  messageCount?: number,
  progressCallback?: (progress: number, text: string) => Promise<void>
): Promise<string> {
  const prefix = (guild.id === '1096684955045728328') ? 'MineKeo' : 'Unknown';
  const backupId = `${prefix}_${generateShortBackupId()}`;

  const steps = [
    { name: 'Roles', func: backupRoles },
    { name: 'Channels', func: backupChannelsStructure },
    { name: 'Messages', func: backupMessages },
    { name: 'Threads', func: backupThreads },
    { name: 'ForumPosts', func: backupForumPosts },
    { name: 'Nicknames', func: backupNicknames },
    { name: 'RoleAssignments', func: backupRoleAssignments },
    { name: 'Bans', func: backupBans },
    { name: 'Webhooks', func: backupWebhooks },
    { name: 'Emojis', func: backupEmojis },
    { name: 'Integrations', func: backupIntegrations }
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
      } else {
        await step.func(guild, backupId);
      }
    } catch (error) {
      console.error(`[Backup] Lỗi khi backup ${step.name}:`, error);
      if (progressCallback) {
        await progressCallback(progress, `Lỗi khi backup ${step.name}`);
      }
    }
  }

  const filePath = await exportBackupToJson(guild.id, backupId);
  console.log(`[Backup] ✅ Hoàn tất backup cho guild ${guild.id} với ID: ${backupId}`);

  await updateSecurityConfig({
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
export async function cleanupOldBackups(guildId: string): Promise<void> {
  const backupDir = path.join(process.cwd(), 'backups');
  try {
    await accessAsync(backupDir);
  } catch (err) {
    return;
  }

  let files = await readdirAsync(backupDir);
  files = files.filter(file => file.startsWith(guildId) && file.endsWith('.json'));

  const fileStats: BackupFileStat[] = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(backupDir, file);
      const stats = await statAsync(filePath);
      return { file, mtime: stats.mtime.getTime() };
    })
  );

  const now = Date.now();
  const oldFiles = fileStats.filter(f => now - f.mtime > SEVEN_DAYS_IN_MS);
  for (const f of oldFiles) {
    try {
      await unlinkAsync(path.join(backupDir, f.file));
      console.log(`[Cleanup] Deleted backup file (older than 7 days): ${f.file}`);
    } catch (err) {
      console.warn(`[Cleanup] Error deleting file ${f.file}:`, err);
    }
  }

  let remainingFiles = await readdirAsync(backupDir);
  remainingFiles = remainingFiles.filter(file => file.startsWith(guildId) && file.endsWith('.json'));

  const remainingStats: BackupFileStat[] = await Promise.all(
    remainingFiles.map(async (file) => {
      const filePath = path.join(backupDir, file);
      const stats = await statAsync(filePath);
      return { file, mtime: stats.mtime.getTime() };
    })
  );
  remainingStats.sort((a, b) => b.mtime - a.mtime);

  if (remainingStats.length > MAX_BACKUP_FILES) {
    const excessFiles = remainingStats.slice(MAX_BACKUP_FILES);
    for (const f of excessFiles) {
      try {
        await unlinkAsync(path.join(backupDir, f.file));
        console.log(`[Cleanup] Deleted excess backup file: ${f.file}`);
      } catch (err) {
        console.warn(`[Cleanup] Error deleting excess file ${f.file}:`, err);
      }
    }
  }
}

/**
 * Đặt interval tự động backup.
 */
export function setBackupInterval(guild: Guild, intervalMinutes: number, messageCount?: number) {
  if (backupIntervals.has(guild.id)) {
    clearInterval(backupIntervals.get(guild.id)!);
  }
  const intervalMs = intervalMinutes * 60_000;

  const handle = setInterval(() => {
    console.log(`[Backup] Tự động backup cho guild ${guild.id}`);
    createBackup(guild, messageCount).catch(console.error);
  }, intervalMs);

  backupIntervals.set(guild.id, handle);
}

export function clearBackupInterval(guildId: string) {
  const handle = backupIntervals.get(guildId);
  if (handle) {
    clearInterval(handle);
    backupIntervals.delete(guildId);
  }
}

export async function createMinimalSnapshotBackup(guild: Guild): Promise<string> {
  const snapshotId = `snapshot_${Date.now()}`;
  // Backup các thành phần tối thiểu (roles, channels, webhooks) 
  await backupRoles(guild, snapshotId);
  await backupChannelsStructure(guild, snapshotId);
  await backupWebhooks(guild, snapshotId);
  await exportBackupToJson(guild.id, snapshotId);
  console.log(`[Backup] 📊 Snapshot nhanh (tối thiểu) đã được tạo: ${snapshotId}`);
  return snapshotId;
}

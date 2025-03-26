// src/automod/panicMode.ts

import {
  Guild,
  TextChannel,
  EmbedBuilder,
  GuildMember
} from 'discord.js';
import config from '../config/securityConfig';
import { getRiskScore } from './riskScore';
import { createMinimalSnapshotBackup } from './backupManager';
import { restoreFull } from './restoreManager';

const panicModeGuilds: Set<string> = new Set();
const panicSnapshotMap: Map<string, string> = new Map(); // Lưu snapshot ID cho mỗi guild
const recentActions: Map<string, number[]> = new Map(); // [timestamp, timestamp, ...]
const PANIC_DURATION_MS = 15 * 60 * 1000;
const AUTO_PANIC_ACTION_THRESHOLD = 4;
const ACTION_WINDOW_MS = 30 * 1000;

/**
 * Bật Panic Mode cho guild.
 * @param guild server
 * @param triggeredBy ID người kích hoạt (có thể là user.id)
 */
export async function enablePanicMode(guild: Guild, triggeredBy: string) {
  if (panicModeGuilds.has(guild.id)) return;
  panicModeGuilds.add(guild.id);

  // Thông báo kênh log
  const logChannel = getLogChannel(guild);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('🛑 Panic Mode Đã Bật')
      .setDescription(`Panic Mode được kích hoạt bởi <@${triggeredBy}>.`)
      .setFooter({ text: `Guild ID: ${guild.id}` })
      .setTimestamp();
    await logChannel.send({ embeds: [embed] });
  }

  // Freeze tất cả user (trừ bot, owner, admin)
  for (const member of guild.members.cache.values()) {
    if (
      member.user.bot ||
      member.id === guild.ownerId ||
      member.permissions.has('Administrator')
    ) continue;
    await freezeUser(guild, member.id);
  }

  // (Tuỳ chọn) Tạo snapshot backup nhanh
  // Nếu bạn muốn rollback, có thể lưu snapshotId
  // const snapshotId = await createMinimalSnapshotBackup(guild);
  // panicSnapshotMap.set(guild.id, snapshotId);

  // Tự động tắt sau X ms (nếu có cấu hình)
  const autoDisableMs = config.antiNuke?.panicMode?.autoDisableAfterMs || PANIC_DURATION_MS;
  setTimeout(() => {
    disablePanicMode(guild, 'System (Timeout)');
  }, autoDisableMs);
}

/**
 * Tắt Panic Mode cho guild (thủ công hoặc tự động).
 */
export async function disablePanicMode(guild: Guild, triggeredBy: string) {
  if (!panicModeGuilds.has(guild.id)) return;
  panicModeGuilds.delete(guild.id);

  const logChannel = getLogChannel(guild);
  if (logChannel) {
    const embed = new EmbedBuilder()
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
export function isPanicModeActive(guildId: string) {
  return panicModeGuilds.has(guildId);
}

/**
 * Freeze 1 user bằng cách gán họ vào role "Frozen".
 */
export async function freezeUser(guild: Guild, userId: string) {
  try {
    const member = await guild.members.fetch(userId);
    if (!member) return;
    const freezeRole = await getOrCreateFreezeRole(guild);
    await member.roles.add(freezeRole, 'Panic Mode: Freeze user nghi ngờ');
    console.log(`[PanicMode] Đã freeze user ${member.user.tag}`);
  } catch (err) {
    console.error(`[PanicMode] Lỗi khi freeze user ${userId}:`, err);
  }
}

/**
 * Unfreeze 1 user (gỡ role "Frozen").
 */
export async function unfreezeUser(guild: Guild, userId: string) {
  try {
    const member = await guild.members.fetch(userId);
    if (!member) return;
    const freezeRole = await getOrCreateFreezeRole(guild);
    if (member.roles.cache.has(freezeRole.id)) {
      await member.roles.remove(freezeRole, 'Panic Mode: Unfreeze user');
      console.log(`[PanicMode] Đã unfreeze user ${member.user.tag}`);
    }
  } catch (err) {
    console.error(`[PanicMode] Lỗi khi unfreeze user ${userId}:`, err);
  }
}

/**
 * Unfreeze toàn bộ user trong server.
 */
export async function unfreezeAllUsers(guild: Guild) {
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
async function getOrCreateFreezeRole(guild: Guild) {
  const roleName = config.antiNuke?.panicMode?.freezeRoleName || 'Frozen';
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
function getLogChannel(guild: Guild): TextChannel | null {
  const channelId = config.restore?.logChannelId;
  const channel = guild.channels.cache.get(channelId || '');
  return (channel && channel.isTextBased()) ? (channel as TextChannel) : null;
}

/**
 * Khi phát hiện hành vi nguy hiểm, gọi hàm này để kích hoạt Panic Mode theo risk score.
 */
export async function maybeTriggerPanicByRisk(guild: Guild, userId: string) {
  const score = await getRiskScore(guild.id, userId);
  if (score >= 30 && !isPanicModeActive(guild.id)) {
    await enablePanicMode(guild, userId);
  }
}

/**
 * Khi phát hiện nhiều hành động liên tiếp, gọi hàm này để kích hoạt Panic Mode.
 */
export async function maybeTriggerPanicByRapidEvents(guild: Guild, userId: string) {
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
export async function rollbackPanic(guild: Guild): Promise<void> {
  // Giả sử bạn có map panicSnapshotMap: Map<string, string> lưu snapshot ID
  if (!panicSnapshotMap.has(guild.id)) {
    console.warn(`[PanicMode] Không có snapshot để rollback cho guild ${guild.name}.`);
    return;
  }
  const snapshotId = panicSnapshotMap.get(guild.id)!;
  console.log(`[PanicMode] Rollback server ${guild.name} về snapshot ${snapshotId}`);
  await restoreFull(guild, snapshotId);
  // Sau khi rollback, có thể xoá snapshot khỏi map
  panicSnapshotMap.delete(guild.id);
}
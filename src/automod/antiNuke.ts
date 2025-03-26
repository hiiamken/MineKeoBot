// src/automod/antinuke.ts

import {
  Guild,
  AuditLogEvent,
  EmbedBuilder,
  User,
  TextChannel,
  PermissionsBitField
} from 'discord.js';
import config from '../config/securityConfig';
import {
  restoreFull,
  restoreChannelById,
  restoreRoleById,
  restoreWebhookById
} from './restoreManager';
import { quarantineUser } from './quarantineUtils';
import { client } from '../bot';
import fs from 'fs';
import path from 'path';
import { initDatabase } from '../database/database';
import { addRiskScore, getRiskScore } from './riskScore';
import { maybeTriggerPanicByRisk, maybeTriggerPanicByRapidEvents } from './panicMode';
import { createMinimalSnapshotBackup } from './backupManager';

const actionCounter: Map<string, number> = new Map();
const webhookCreateCounter: Map<string, { count: number; lastTime: number }> = new Map();
const WEBHOOK_SPAM_LIMIT = 5;
const WEBHOOK_SPAM_WINDOW_MS = 30 * 1000;

// Bản đồ risk score cho từng loại AuditLogEvent
const riskScoreMap: Record<number, number> = {
  [AuditLogEvent.ChannelCreate]: 1,
  [AuditLogEvent.ChannelDelete]: 5,
  [AuditLogEvent.RoleCreate]: 2,
  [AuditLogEvent.RoleDelete]: 5,
  [AuditLogEvent.MemberBanAdd]: 4,
  [AuditLogEvent.WebhookCreate]: 3,
  [AuditLogEvent.WebhookDelete]: 4,
  [AuditLogEvent.MemberKick]: 3,
  [AuditLogEvent.RoleUpdate]: 2,
  [AuditLogEvent.WebhookUpdate]: 2,
  [AuditLogEvent.EmojiUpdate]: 1,
  [AuditLogEvent.StickerUpdate]: 1,
  [AuditLogEvent.MemberUpdate]: 1,
  [AuditLogEvent.GuildUpdate]: 5,
  [AuditLogEvent.ChannelOverwriteUpdate]: 2
};

// Hàm tiện ích để xác định mức cảnh báo dựa trên risk score
function getAlertLevel(totalScore: number): 'warning' | 'critical' | 'emergency' | null {
  const levels = config.antiNuke.alertLevels;
  if (totalScore >= levels.emergency) {
    return 'emergency';
  } else if (totalScore >= levels.critical) {
    return 'critical';
  } else if (totalScore >= levels.warning) {
    return 'warning';
  }
  return null;
}

export async function monitorAuditEvent(guild: Guild, eventType: AuditLogEvent) {
  try {
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: eventType });
    const entry = auditLogs.entries.first();
    if (!entry) return;

    const executor = entry.executor;
    const target = entry.target;
    if (!executor || executor.bot) return;

    const member = await guild.members.fetch(executor.id).catch(() => null);
    if (!member) return;

    // Kiểm tra whitelist
    const hasBypass =
      config.antiNuke.whitelistedUsers.includes(executor.id) ||
      member.roles.cache.some(role => config.antiNuke.whitelistedRoles.includes(role.id)) ||
      member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      executor.id === guild.ownerId;
    if (hasBypass) return;

    const key = `${guild.id}-${executor.id}`;
    const count = (actionCounter.get(key) || 0) + 1;
    actionCounter.set(key, count);

    // Thêm risk score theo event
    const baseScore = riskScoreMap[eventType] || 2;
    await addRiskScore(guild.id, executor.id, baseScore);

    // Các hành động khác: log behavior, gửi cảnh báo, restore, quarantine, snapshot, v.v.
    await logBehavior(guild, executor, eventType, count, target);
    await sendAntiNukeAlert(guild, executor, eventType, count, target);

    // Xử lý webhook spam và restore nếu cần (giữ nguyên)

    // Kiểm tra tổng risk score
    const totalScore = await getRiskScore(guild.id, executor.id) ?? 0;
    const alertLevel = getAlertLevel(totalScore);
    console.log(`[AntiNuke] ${executor.tag} có risk score ${totalScore}, alert level: ${alertLevel}`);

    // Phản ứng theo mức alert:
    if (alertLevel === 'warning') {
      // Chỉ gửi cảnh báo, log thêm (hoặc tăng risk score)
      console.warn(`[AntiNuke] [WARNING] ${executor.tag} có hành vi khả nghi, nhưng chưa vượt ngưỡng Critical.`);
    } else if (alertLevel === 'critical') {
      // Có thể quarantine người dùng
      console.warn(`[AntiNuke] [CRITICAL] ${executor.tag} vượt ngưỡng Critical.`);
      await quarantineUser(guild, executor.id);
    } else if (alertLevel === 'emergency') {
      // Hành động cấp bách: ban người dùng, kích hoạt Panic Mode, restore backup, …
      console.warn(`[AntiNuke] [EMERGENCY] ${executor.tag} vượt ngưỡng Emergency.`);
      await member.ban({ reason: `Anti-Nuke: Risk Score quá cao (${totalScore})` }).catch(() => {});
    }

    await maybeTriggerPanicByRisk(guild, executor.id);
    await maybeTriggerPanicByRapidEvents(guild, executor.id);

  } catch (error) {
    console.error('[AntiNuke] ❌ Lỗi khi xử lý audit event:', error);
  }
}

async function sendAntiNukeAlert(
  guild: Guild,
  executor: User,
  event: AuditLogEvent,
  count: number,
  target: any
) {
  const logChannelId = config.restore?.logChannelId;
  const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;
  if (!logChannel || !logChannel.isTextBased()) return;

  // Lấy risk score hiện tại
  const totalScore = await getRiskScore(guild.id, executor.id) ?? 0;
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: 'Số lượng hành động', value: `${count}`, inline: true },
    { name: 'Điểm rủi ro hiện tại', value: `${totalScore}`, inline: true }
  ];

  if ((target as any)?.id) {
    fields.push({
      name: 'Đối tượng bị ảnh hưởng',
      value: `${(target as any).name || (target as any).id}`,
      inline: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor('Orange')
    .setTitle('⚠️ Hành vi nguy hiểm được phát hiện')
    .setDescription(`${executor.tag} (${executor.id}) đã thực hiện hành động **${AuditLogEvent[event]}**.`)
    .addFields(fields)
    .setTimestamp();

  await (logChannel as TextChannel).send({ embeds: [embed] }).catch(() => {});

  try {
    const owner = await guild.fetchOwner();
    if (owner) {
      await owner.send({
        content: `🚨 **CẢNH BÁO ANTI-NUKE**: ${executor.tag} vừa thực hiện hành vi nguy hiểm: **${AuditLogEvent[event]}** tại server ${guild.name}.`
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[AntiNuke] Không gửi được DM tới owner:', err);
  }
}

async function logBehavior(
  guild: Guild,
  user: User,
  event: AuditLogEvent,
  count: number,
  target: any
) {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${user.tag} (${user.id}) thực hiện ${AuditLogEvent[event]} - Count: ${count}`;
  console.log('[AuditLog]', log);

  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logPath = path.join(logDir, `antinuke_${guild.id}.log`);
  fs.appendFileSync(logPath, log + '\n');

  const db = await initDatabase();
  await db.run(
    `INSERT INTO antinuke_logs (guild_id, user_id, username, event, target, count, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      guild.id,
      user.id,
      user.tag,
      AuditLogEvent[event],
      target?.id || '',
      count,
      timestamp
    ]
  );
}

export const auditEventsToMonitor: AuditLogEvent[] = [
  AuditLogEvent.ChannelCreate,
  AuditLogEvent.ChannelDelete,
  AuditLogEvent.RoleCreate,
  AuditLogEvent.RoleDelete,
  AuditLogEvent.MemberBanAdd,
  AuditLogEvent.WebhookCreate,
  AuditLogEvent.WebhookDelete,
  AuditLogEvent.MemberKick,
  AuditLogEvent.RoleUpdate,
  AuditLogEvent.WebhookUpdate,
  AuditLogEvent.EmojiUpdate,
  AuditLogEvent.StickerUpdate,
  AuditLogEvent.MemberUpdate,
  AuditLogEvent.GuildUpdate,
  AuditLogEvent.ChannelOverwriteUpdate
];

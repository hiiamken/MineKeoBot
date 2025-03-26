// src/automod/antiRaid.ts

import {
  Guild,
  GuildMember,
  ChannelType,
  PermissionsBitField,
  TextChannel,
  AuditLogEvent,
  User,
  EmbedBuilder
} from 'discord.js';
import config from '../config/securityConfig';
import { client } from '../bot';
import { quarantineUser } from './quarantineUtils';
import { initDatabase } from '../database/database';
import { addRiskScore, getRiskScore } from './riskScore';
import { maybeTriggerPanicByRapidEvents, maybeTriggerPanicByRisk } from './panicMode';
import { createMinimalSnapshotBackup } from './backupManager';
import fs from 'fs';
import path from 'path';
import { logJoinDetail } from './antiRaidDetailedLogs';

const joinTimestamps: Map<string, number[]> = new Map();
const lockedGuilds: Set<string> = new Set();
const recentJoins: Map<string, GuildMember[]> = new Map();

// Các ngưỡng của AntiRaid được đặt trong config.antiNuke.antiRaid (ví dụ: scoreLimit)
  
function calculateJoinScore(member: GuildMember, guildId: string, joins: GuildMember[]): number {
  const now = Date.now();
  let score = 0;
  const ageMinutes = (now - member.user.createdAt.getTime()) / (60 * 1000);
  const ageDays = ageMinutes / 1440;
  const avatar = member.user.avatar;
  const configRaid = (config.antiNuke as any).antiRaid;

  if (ageDays < (configRaid?.accountAgeThreshold || 5)) {
    score += configRaid?.accountAgeScore || 5;
  }
  if (!avatar) {
    score += configRaid?.noAvatarScore || 5;
  }
  const lastJoin = joinTimestamps.get(guildId)?.slice(-2)[0];
  if (lastJoin && now - lastJoin <= 10_000) {
    score += configRaid?.joinRowScore || 10;
  }
  return score;
}

/**
 * Hàm xử lý khi có thành viên mới tham gia để phát hiện hành vi Raid.
 */
export async function handleAntiRaidJoin(member: GuildMember) {
  const guild = member.guild;
  const guildId = guild.id;

  if (
    member.user.bot ||
    config.antiNuke.whitelistedUsers.includes(member.id) ||
    member.roles.cache.some(r => config.antiNuke.whitelistedRoles.includes(r.id))
  ) return;

  const now = Date.now();
  const timestamps = joinTimestamps.get(guildId) || [];
  timestamps.push(now);
  joinTimestamps.set(guildId, timestamps.filter(t => now - t <= 60_000));

  const joins = recentJoins.get(guildId) || [];
  joins.push(member);
  recentJoins.set(guildId, joins);

  // Tính toán các tiêu chí:
  const ageMinutes = (now - member.user.createdAt.getTime()) / (60 * 1000);
  const ageDays = ageMinutes / 1440;
  const hasAvatar = member.user.avatar ? 1 : 0;
  // Tính điểm cơ bản từ các cấu hình
  const configRaid = (config.antiNuke as any).antiRaid;
  let score = 0;
  if (ageDays < (configRaid?.accountAgeThreshold || 5)) {
    score += configRaid?.accountAgeScore || 5;
  }
  if (!hasAvatar) {
    score += configRaid?.noAvatarScore || 5;
  }
  const lastJoin = joinTimestamps.get(guildId)?.slice(-2)[0];
  if (lastJoin && now - lastJoin <= 10_000) {
    score += configRaid?.joinRowScore || 10;
  }

  // Ghi log chi tiết cho hành động join
  await logJoinDetail(
    guildId,
    member.id,
    score,
    ageDays,
    hasAvatar,
    { tag: member.user.tag, createdAt: member.user.createdAt }
  );

  // Tính tổng điểm của các thành viên join gần đây
  const totalScore = joins.reduce((acc, m) => {
    const mAgeDays = (now - m.user.createdAt.getTime()) / (60 * 1000 * 1440);
    const mHasAvatar = m.user.avatar ? 1 : 0;
    let mScore = 0;
    if (mAgeDays < (configRaid?.accountAgeThreshold || 5)) {
      mScore += configRaid?.accountAgeScore || 5;
    }
    if (!mHasAvatar) {
      mScore += configRaid?.noAvatarScore || 5;
    }
    const mLastJoin = joinTimestamps.get(guildId)?.slice(-2)[0];
    if (mLastJoin && now - mLastJoin <= 10_000) {
      mScore += configRaid?.joinRowScore || 10;
    }
    return acc + mScore;
  }, 0);

  console.log(`[AntiRaid] ${member.user.tag} joined, score: ${score}, total: ${totalScore}`);

  const scoreLimit = (config.antiNuke as any).antiRaid?.scoreLimit || 50;
  if (totalScore >= scoreLimit && !lockedGuilds.has(guildId)) {
    await lockGuildPartial(guild);
    setTimeout(() => unlockGuildPartial(guild).catch(console.error), 5 * 60 * 1000);
  }
}

function lockGuildPartial(guild: Guild): Promise<void> {
  const guildId = guild.id;
  const everyone = guild.roles.everyone;
  lockedGuilds.add(guildId);
  const promises: Promise<any>[] = [];

  for (const [, channel] of guild.channels.cache) {
    if (!channel.isTextBased?.() || [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type)) continue;
    const textChannel = channel as TextChannel;
    const perms = textChannel.permissionOverwrites.cache.get(everyone.id);
    if (perms?.deny.has(PermissionsBitField.Flags.SendMessages)) continue;
    promises.push(
      textChannel.permissionOverwrites.edit(everyone, {
        SendMessages: false,
        CreateInstantInvite: false
      }, { reason: 'AntiRaid: Lockdown tạm thời do join quá nhanh' }).catch(() => {})
    );
  }
  console.warn(`[AntiRaid] 🔒 Đã khóa một số kênh của server ${guild.name} theo chế độ lockdown từng phần.`);
  return Promise.all(promises).then(() => {});
}

function unlockGuildPartial(guild: Guild): Promise<void> {
  const everyone = guild.roles.everyone;
  const promises: Promise<any>[] = [];
  for (const [, channel] of guild.channels.cache) {
    if (!channel.isTextBased?.() || [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type)) continue;
    const textChannel = channel as TextChannel;
    promises.push(
      textChannel.permissionOverwrites.edit(everyone, {
        SendMessages: null,
        CreateInstantInvite: null
      }, { reason: 'AntiRaid: Mở khóa sau lockdown từng phần' }).catch(() => {})
    );
  }
  lockedGuilds.delete(guild.id);
  console.log(`[AntiRaid] 🔓 Đã mở khóa server ${guild.name} từ chế độ lockdown từng phần.`);
  return Promise.all(promises).then(() => {});
}

export function isGuildLocked(guildId: string): boolean {
  return lockedGuilds.has(guildId);
}

export function getRecentJoins(guildId: string): GuildMember[] {
  return recentJoins.get(guildId) || [];
}

/**
 * Ghi log hành vi vào file và database.
 */
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

/**
 * Gửi cảnh báo qua kênh log và DM owner.
 */
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

  const totalScore = await getRiskScore(guild.id, executor.id) ?? 0;
  const fields = [
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
        content: `🚨 **CẢNH BÁO ANTI-NUKE**: ${executor.tag} vừa thực hiện hành động nguy hiểm: **${AuditLogEvent[event]}** tại server ${guild.name}.`
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[AntiNuke] Không gửi được DM tới owner:', err);
  }
}

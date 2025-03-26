// src/automod/restoreManager.ts

import {
  Guild,
  ChannelType,
  TextChannel,
  EmbedBuilder
} from 'discord.js';
import { initDatabase } from '../database/database';
import config from '../config/securityConfig';
import { client } from '../bot';
import { Database } from 'sqlite';    // Hoặc từ 'better-sqlite3' tuỳ bạn
import { ChannelRow, RoleRow, BanRow } from './types';
import { verifyBackupFile } from './verifyBackupFile';


import {
  restoreRoles,
  restoreChannels,
  restoreChannelPermissions,
  restoreNicknames,
  restoreRoleAssignments,
  restoreBans,
  restoreMessages,
  restoreThreads,
  restoreEmojis,
  restoreWebhooks,
  restoreIntegrations
} from './restoreUtils';

/**
 * Mô tả cấu trúc một yêu cầu khôi phục (backup request)
 */
interface RestoreRequest {
  guildId: string;
  backupId: string;
  type: 'full' | 'partial';
  components?: string[];
  requestedAt: number;
}

/**
 * Mảng cục bộ lưu trữ các yêu cầu khôi phục.
 * Mọi nơi đều dùng chung mảng này để thêm/tìm/xoá request.
 */
const pendingRestoreRequests: RestoreRequest[] = [];

/**
 * Lấy danh sách tất cả yêu cầu khôi phục đang chờ
 */
export function getPendingRestoreRequests(): RestoreRequest[] {
  return pendingRestoreRequests;
}

/**
 * Thêm một yêu cầu khôi phục vào danh sách
 */
export function addRestoreRequest(request: RestoreRequest) {
  pendingRestoreRequests.push(request);
}

/**
 * Xoá một yêu cầu khôi phục khỏi danh sách, dựa trên chỉ số (index)
 */
export function removeRestoreRequest(index: number) {
  pendingRestoreRequests.splice(index, 1);
}

/**
 * So sánh snapshot backup với server hiện tại.
 * Luôn trả về 1 embed, có các field thể hiện các mục chính.
 * Nếu không có thay đổi ở mục nào, ghi "Không có".
 * @param guild - Server hiện tại
 * @param backupId - ID bản backup
 * @param showDetails - Hiển thị chi tiết hay không
 */
export async function compareSnapshot(
  guild: Guild,
  backupId: string,
  showDetails = false
): Promise<EmbedBuilder[]> {
  const db: Database = await initDatabase();
  
  // 1) Lấy dữ liệu kênh từ backup
  const backupChannels = await db.all<ChannelRow[]>(
    `SELECT id, name FROM channels WHERE backup_id = ?`,
    [backupId]
  );
  const backupNames = backupChannels.map(ch => ch.name.toLowerCase());

  // Lấy kênh hiện tại (bỏ null, DM, GroupDM)
  const currentChannelsFetched = await guild.channels.fetch();
  const currentChannelsArray = Array.from(currentChannelsFetched.values())
    .filter((ch): ch is NonNullable<typeof ch> => ch !== null)
    .filter(ch => Number(ch.type) !== ChannelType.DM && Number(ch.type) !== ChannelType.GroupDM)
    .map(ch => ({ id: ch.id, name: ch.name }));

  const currentNames = currentChannelsArray.map(ch => ch.name.toLowerCase());

  // Kênh thiếu
  const missingChannels = backupChannels.filter(
    bch => !currentNames.includes(bch.name.toLowerCase())
  );
  // Kênh thừa
  const extraChannels = currentChannelsArray.filter(
    ch => !backupNames.includes(ch.name.toLowerCase())
  );
  // Kênh trùng
  const nameCountMap: Record<string, number> = {};
  for (const cname of currentNames) {
    nameCountMap[cname] = (nameCountMap[cname] || 0) + 1;
  }
  const duplicateChannels = Object.entries(nameCountMap)
    .filter(([_, count]) => count > 1)
    .map(([name, count]) => ({ name, count }));

  // 2) Lấy dữ liệu role
  const [backupRoles, currentRoles] = await Promise.all([
    db.all<RoleRow[]>(`SELECT id, name, permissions FROM roles WHERE backup_id = ?`, [backupId]),
    guild.roles.fetch().then(r =>
      Array.from(r.values())
        .filter(rr => rr.name !== '@everyone')
        .map(rr => ({
          id: rr.id,
          name: rr.name,
          permissions: rr.permissions.bitfield.toString()
        }))
    )
  ]);

  const changedRoles = backupRoles.filter(brole => {
    const current = currentRoles.find(
      cr => cr.name.toLowerCase() === brole.name.toLowerCase()
    );
    return current && current.permissions !== brole.permissions;
  });

  // 3) Lấy dữ liệu bans
  const [backupBans, currentBanIds] = await Promise.all([
    db.all<BanRow[]>(`SELECT user_id FROM bans WHERE backup_id = ?`, [backupId]),
    guild.bans.fetch().then(b =>
      Array.from(b.values())
        .filter(ban => ban !== null)
        .map(ban => ban.user.id)
    )
  ]);
  const backupBanIds = backupBans.map(b => b.user_id);
  const kickedUsers = backupBanIds.filter(id => !currentBanIds.includes(id));

  // 4) Tạo embed
  const embed = new EmbedBuilder()
    .setTitle(`📊 So sánh Snapshot • Backup ID: ${backupId}`)
    .setColor('Blue')
    .setFooter({ text: showDetails ? 'Chế độ chi tiết' : 'Chế độ gọn' })
    .setTimestamp();

  // Field: Kênh bị thiếu
  if (missingChannels.length > 0) {
    const desc = showDetails
      ? missingChannels.map(ch => `• ${ch.name}`).join('\n')
      : missingChannels.map(ch => `\`${ch.name}\``).join(', ');
    embed.addFields({ name: '❌ Kênh thiếu', value: desc, inline: false });
  } else {
    embed.addFields({ name: '❌ Kênh thiếu', value: 'Không có', inline: false });
  }

  // Field: Kênh thừa
  if (extraChannels.length > 0) {
    const desc = showDetails
      ? extraChannels.map(ch => `• ${ch.name}`).join('\n')
      : extraChannels.map(ch => `\`${ch.name}\``).join(', ');
    embed.addFields({ name: '➕ Kênh thừa', value: desc, inline: false });
  } else {
    embed.addFields({ name: '➕ Kênh thừa', value: 'Không có', inline: false });
  }

  // Field: Kênh trùng
  if (duplicateChannels.length > 0) {
    if (showDetails) {
      let detailStr = '';
      for (const dup of duplicateChannels) {
        const sameNameChannels = currentChannelsArray.filter(
          ch => ch.name.toLowerCase() === dup.name
        );
        detailStr += `**${dup.name}** (${dup.count} lần)\n` +
          sameNameChannels.map(ch => `• <#${ch.id}> (ID: ${ch.id})`).join('\n') +
          `\n\n`;
      }
      embed.addFields({ name: '🔄 Kênh trùng', value: detailStr, inline: false });
    } else {
      const desc = duplicateChannels
        .map(dc => `\`${dc.name}\`: ${dc.count} lần`)
        .join('\n');
      embed.addFields({ name: '🔄 Kênh trùng', value: desc, inline: false });
    }
  } else {
    embed.addFields({ name: '🔄 Kênh trùng', value: 'Không có', inline: false });
  }

  // Field: Role thay đổi
  if (changedRoles.length > 0) {
    const desc = showDetails
      ? changedRoles.map(r => `• ${r.name}`).join('\n')
      : changedRoles.map(r => `\`${r.name}\``).join(', ');
    embed.addFields({ name: '🛡️ Role thay đổi quyền', value: desc, inline: false });
  } else {
    embed.addFields({ name: '🛡️ Role thay đổi quyền', value: 'Không có', inline: false });
  }

  // Field: Người bị kick/unban
  if (kickedUsers.length > 0) {
    const desc = kickedUsers.map(id => `<@${id}>`).join(', ');
    embed.addFields({ name: '👤 Kick/Unban', value: desc, inline: false });
  } else {
    embed.addFields({ name: '👤 Kick/Unban', value: 'Không có', inline: false });
  }

  return [embed];
}

/**
 * Phục hồi toàn bộ dữ liệu từ backup
 */
export async function restoreFull(guild: Guild, backupId: string, force = false) {
  if (config.restore?.requireApproval && !force) {
    addRestoreRequest({
      guildId: guild.id,
      backupId,
      type: 'full',
      requestedAt: Date.now()
    });
    await notifyRestoreApprovalRequired(guild, backupId, 'full');
    return;
  }

  // Kiểm tra checksum trước khi restore
  const isValid = await verifyBackupFile(guild.id, backupId);
  if (!isValid) {
    console.warn('Checksum không khớp, abort restore.');
    await logRestore(guild.id, backupId, 'checksum-mismatch');
    return; // Hoặc thông báo lỗi cho owner
  }

  console.log(`[Restore] Bắt đầu phục hồi toàn bộ dữ liệu từ backup ID: ${backupId}`);
  await logRestore(guild.id, backupId, 'start');

  // Danh sách các bước phục hồi (loại bỏ bước permission nếu bạn muốn gọi riêng sau)
  const steps = [
    { name: 'roles', func: restoreRoles },
    { name: 'channels', func: restoreChannels },
    { name: 'nicknames', func: restoreNicknames },
    { name: 'roleAssignments', func: restoreRoleAssignments },
    { name: 'bans', func: restoreBans },
    { name: 'messages', func: restoreMessages },
    { name: 'threads', func: restoreThreads },
    { name: 'emojis', func: restoreEmojis },
    { name: 'webhooks', func: restoreWebhooks },
    { name: 'integrations', func: restoreIntegrations }
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const progress = Math.round(((i + 1) / steps.length) * 100);
    try {
      console.log(`[Restore] [${progress}%] Đang phục hồi **${step.name}**...`);
      await step.func(guild, backupId);
    } catch (error) {
      console.warn(`[Restore] ❌ Lỗi khi phục hồi ${step.name}:`, error);
      await logRestore(guild.id, backupId, `error:${step.name}`);
    }
  }

  await logRestore(guild.id, backupId, 'end');

  // Restore permissionOverwrites riêng (nếu có)
  await restoreChannelPermissions(guild, backupId);

  console.log(`[Restore] ✅ Hoàn tất phục hồi dữ liệu cho guild ${guild.id}`);
}

/**
 * Phục hồi một phần dữ liệu (danh sách components)
 */
export async function restorePartial(
  guild: Guild,
  backupId: string,
  components: string[],
  force = false
) {
  // Kiểm tra requireApproval
  if (config.restore?.requireApproval && !force) {
    addRestoreRequest({
      guildId: guild.id,
      backupId,
      type: 'partial',
      components,
      requestedAt: Date.now()
    });
    await notifyRestoreApprovalRequired(guild, backupId, 'partial', components);
    return;
  }

  const log = (msg: string) => console.log(`[RestorePartial] ${msg}`);
  await logRestore(guild.id, backupId, `partial-start: ${components.join(', ')}`);

  const componentMap: Record<string, (g: Guild, id: string) => Promise<void>> = {
    roles: restoreRoles,
    channels: restoreChannels,
    'channel-permissions': restoreChannelPermissions,
    nicknames: restoreNicknames,
    'role-assignments': restoreRoleAssignments,
    bans: restoreBans,
    messages: restoreMessages,
    threads: restoreThreads,
    emojis: restoreEmojis,
    webhooks: restoreWebhooks,
    integrations: restoreIntegrations
  };

  // Lọc ra component hợp lệ
  const validComponents = components.filter((c) => componentMap[c.toLowerCase()]);
  const total = validComponents.length;

  for (let i = 0; i < validComponents.length; i++) {
    const key = validComponents[i].toLowerCase();
    const fn = componentMap[key];
    const progress = Math.round(((i + 1) / total) * 100);

    try {
      log(`[${progress}%] Đang phục hồi **${key}**...`);
      await fn(guild, backupId);
    } catch (err) {
      console.warn(`[RestorePartial] ❌ Lỗi ở component ${key}:`, err);
      await logRestore(guild.id, backupId, `error:${key}`);
    }
  }

  // Các component không hợp lệ
  const invalidComps = components.filter((c) => !validComponents.includes(c));
  if (invalidComps.length > 0) {
    log(`⚠️ Không rõ component: ${invalidComps.join(', ')}`);
  }

  await logRestore(guild.id, backupId, `partial-end: ${components.join(', ')}`);
  log(`✅ Phục hồi các thành phần cụ thể đã hoàn tất.`);
}

/**
 * Gửi thông báo cho owner khi cần phê duyệt
 */
export async function notifyRestoreApprovalRequired(
  guild: Guild,
  backupId: string,
  type: 'full' | 'partial',
  components?: string[]
) {
  const owner = await guild.fetchOwner().catch(() => null);
  if (!owner) return;

  const nowHour = new Date().getHours();
  const suspicious = (config.restore.suspiciousHours as number[]).includes(nowHour);
  const compText = type === 'partial' ? ` (${components?.join(', ')})` : '';

  const embed = new EmbedBuilder()
    .setColor(suspicious ? 'Red' : 'Orange')
    .setTitle('🛑 Yêu cầu phê duyệt khôi phục')
    .setDescription(`Server \`${guild.name}\` (${guild.id}) đã yêu cầu khôi phục ${type}${compText}`)
    .addFields(
      { name: 'Backup ID', value: backupId },
      { name: 'Thời gian', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
      { name: 'Khôi phục ban đêm?', value: suspicious ? '⚠️ Có' : 'Không', inline: true }
    )
    .setFooter({ text: 'Hãy dùng /restore-approve để duyệt hoặc từ chối.' });

  await owner.send({ embeds: [embed] }).catch(() => null);
}

/**
 * Ghi log quá trình restore vào database và gửi embed tới kênh log
 */
export async function logRestore(guildId: string, backupId: string, action: string) {
  const db = await initDatabase();
  const timestamp = new Date().toISOString();

  await db.run(
    `INSERT INTO restore_logs (guild_id, backup_id, action, timestamp) VALUES (?, ?, ?, ?)`,
    [guildId, backupId, action, timestamp]
  );

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const owner = await guild.fetchOwner().catch(() => null);
  const logChannelId = config.restore?.logChannelId;
  const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('📦 Restore Log')
    .addFields(
      { name: 'Backup ID', value: `\`${backupId}\``, inline: true },
      { name: 'Hành động', value: `\`${action}\``, inline: true },
      { name: 'Thời gian', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
    )
    .setTimestamp();

  if (logChannel?.isTextBased?.()) {
    await (logChannel as TextChannel).send({ embeds: [embed] }).catch(() => null);
  } else if (owner) {
    await owner.send({ embeds: [embed] }).catch(() => null);
  }
}

/**
 * Phục hồi kênh theo ID (dùng trong antiNuke)
 */
export async function restoreChannelById(guild: Guild, channelId: string) {
  const db = await initDatabase();
  const channelData = await db.get(
    `SELECT * FROM channels WHERE id = ? AND guild_id = ?`,
    [channelId, guild.id]
  );
  if (!channelData) return;

  await guild.channels
    .create({
      name: channelData.name,
      type: channelData.type,
      position: channelData.position,
      parent: channelData.parent_id ?? undefined,
      reason: 'Anti-Nuke: Phục hồi Channel bị xóa'
    })
    .catch(console.error);
}

/**
 * Phục hồi role theo ID (dùng trong antiNuke)
 */
export async function restoreRoleById(guild: Guild, roleId: string) {
  const db = await initDatabase();
  const role = await db.get(
    `SELECT * FROM roles WHERE id = ? AND guild_id = ?`,
    [roleId, guild.id]
  );
  if (!role) return;

  await guild.roles
    .create({
      name: role.name,
      color: role.color,
      permissions: BigInt(role.permissions),
      hoist: !!role.hoist,
      mentionable: !!role.mentionable,
      position: role.position,
      reason: 'Anti-Nuke: Phục hồi Role bị xóa'
    })
    .catch(console.error);
}

/**
 * Phục hồi webhook theo ID (dùng trong antiNuke)
 */
export async function restoreWebhookById(guild: Guild, webhookId: string) {
  const db = await initDatabase();
  const hook = await db.get(
    `SELECT * FROM webhooks WHERE id = ? AND guild_id = ?`,
    [webhookId, guild.id]
  );
  if (!hook) return;

  const channel = guild.channels.cache.get(hook.channel_id);
  if (!channel || !channel.isTextBased()) return;

  await (channel as TextChannel)
    .createWebhook({
      name: hook.name,
      reason: 'Anti-Nuke: Phục hồi Webhook bị xóa'
    })
    .catch(console.error);
}

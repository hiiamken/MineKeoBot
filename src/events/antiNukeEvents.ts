import { Channel, ChannelType, Role, GuildBan, AuditLogEvent } from 'discord.js';
import { monitorAuditEvent } from '../automod/antiNuke';

/**
 * Khi một kênh được tạo, kiểm tra Anti-Nuke.
 */
export async function onChannelCreate(channel: Channel) {
  if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) return;
  if (!channel.guild) return;
  await monitorAuditEvent(channel.guild, AuditLogEvent.ChannelCreate);
}

/**
 * Khi một kênh bị xóa, kiểm tra Anti-Nuke.
 */
export async function onChannelDelete(channel: Channel) {
  if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) return;
  if (!channel.guild) return;
  await monitorAuditEvent(channel.guild, AuditLogEvent.ChannelDelete);
}

/**
 * Khi một role được tạo, kiểm tra Anti-Nuke.
 */
export async function onRoleCreate(role: Role) {
  if (!role.guild) return;
  await monitorAuditEvent(role.guild, AuditLogEvent.RoleCreate);
}

/**
 * Khi một role bị xóa, kiểm tra Anti-Nuke.
 */
export async function onRoleDelete(role: Role) {
  if (!role.guild) return;
  await monitorAuditEvent(role.guild, AuditLogEvent.RoleDelete);
}

/**
 * Khi một thành viên bị ban, kiểm tra Anti-Nuke.
 */
export async function onGuildBanAdd(ban: GuildBan) {
  if (!ban.guild) return;
  await monitorAuditEvent(ban.guild, AuditLogEvent.MemberBanAdd);
}

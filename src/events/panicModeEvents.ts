// src/events/panicModeEvents.ts

import { Channel, ChannelType, Role, GuildBan } from 'discord.js';
import { isPanicModeActive } from '../automod/panicMode';

/**
 * Khi một kênh được tạo, kiểm tra Panic Mode.
 */
export function onChannelCreate(channel: Channel) {
  if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) return;
  if (!channel.guild) return;
  
  // Thay vì "await checkPanicMode", ta chỉ cần gọi isPanicModeActive nếu muốn biết đang bật/tắt
  const active = isPanicModeActive(channel.guild.id);
  // Bạn có thể thêm logic tùy ý, ví dụ:
  // if (active) { ... } else { ... }
}

/**
 * Khi một kênh bị xóa, kiểm tra Panic Mode.
 */
export function onChannelDelete(channel: Channel) {
  if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) return;
  if (!channel.guild) return;
  
  const active = isPanicModeActive(channel.guild.id);
  // Tùy logic
}

/**
 * Khi một role được tạo, kiểm tra Panic Mode.
 */
export function onRoleCreate(role: Role) {
  if (!role.guild) return;
  const active = isPanicModeActive(role.guild.id);
  // Tùy logic
}

/**
 * Khi một role bị xóa, kiểm tra Panic Mode.
 */
export function onRoleDelete(role: Role) {
  if (!role.guild) return;
  const active = isPanicModeActive(role.guild.id);
  // Tùy logic
}

/**
 * Khi một thành viên bị ban, kiểm tra Panic Mode.
 */
export function onGuildBanAdd(ban: GuildBan) {
  if (!ban.guild) return;
  const active = isPanicModeActive(ban.guild.id);
  // Tùy logic
}

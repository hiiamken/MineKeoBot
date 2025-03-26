// src/automod/quarantineUtils.ts

import { Guild } from 'discord.js';
import config from '../config/securityConfig';

/**
 * Áp dụng cách ly cho người dùng bị nghi nuke.
 */
export async function quarantineUser(guild: Guild, userId: string) {
  try {
    const member = await guild.members.fetch(userId);
    if (!member) return;

    let quarantineRole = guild.roles.cache.find(role => role.name === config.antiNuke.quarantineRoleName);
    if (!quarantineRole) {
      quarantineRole = await guild.roles.create({
        name: config.antiNuke.quarantineRoleName,
        permissions: [],
        reason: 'Anti-Nuke: Tạo role cách ly'
      });
    }

    await member.roles.set([quarantineRole.id], 'Anti-Nuke: Cách ly do vượt ngưỡng hành vi nguy hiểm');
    console.log(`[AntiNuke] ✅ Đã cách ly ${member.user.tag} (${member.id})`);
  } catch (error) {
    console.error('[AntiNuke] ❌ Lỗi khi cách ly người dùng:', error);
  }
}

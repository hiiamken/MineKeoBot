// src/automod/freezeUtils.ts

import { Guild } from 'discord.js';
import config from '../config/securityConfig';

/**
 * Freeze 1 user bằng cách gán họ vào role freezeRoleName (mặc định 'Frozen').
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
 * Unfreeze 1 user bằng cách gỡ role freeze.
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
 * Lấy hoặc tạo role freeze (mặc định 'Frozen').
 */
async function getOrCreateFreezeRole(guild: Guild) {
  const roleName = config.antiNuke.panicMode?.freezeRoleName || 'Frozen';
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

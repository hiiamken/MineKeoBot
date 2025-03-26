// src/handlers/reactionRoleLoader.ts

import { initDatabase } from '../database/database';
import { ReactionRoleConfig } from '../config/reactionRoleConfig';

export async function saveReactionRoleMessage(
  messageId: string,
  guildId: string,
  channelId: string,
  type: 'normal' | 'unique',
  openingText: string,
  closingText: string
): Promise<void> {
  const db = await initDatabase();
  await db.run(
    `INSERT OR REPLACE INTO reaction_role_messages (message_id, guild_id, channel_id, type, opening_text, closing_text)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, guildId, channelId, type, openingText, closingText]
  );
}

export async function saveReactionRoleMapping(
  messageId: string,
  emoji: string,
  roleId: string
): Promise<void> {
  const db = await initDatabase();
  await db.run(
    `INSERT OR REPLACE INTO reaction_role_mappings (message_id, emoji, role_id)
     VALUES (?, ?, ?)`,
    [messageId, emoji, roleId]
  );
}

export async function getReactionRoleMessage(messageId: string): Promise<ReactionRoleConfig | null> {
  const db = await initDatabase();
  const row = await db.get(`SELECT * FROM reaction_role_messages WHERE message_id = ?`, [messageId]);
  if (!row) return null;
  return {
    message_id: row.message_id,
    guild_id: row.guild_id,
    channel_id: row.channel_id,
    type: row.type,
    opening_text: row.opening_text ?? '',
    closing_text: row.closing_text ?? ''
  };
}

export async function getReactionRoleMappings(messageId: string): Promise<Map<string, string>> {
  const db = await initDatabase();
  const rows = await db.all(`SELECT emoji, role_id FROM reaction_role_mappings WHERE message_id = ?`, [messageId]);
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.emoji, row.role_id);
  }
  return map;
}

export async function deleteReactionRoleMessage(messageId: string): Promise<void> {
  const db = await initDatabase();
  await db.run(`DELETE FROM reaction_role_messages WHERE message_id = ?`, [messageId]);
  await db.run(`DELETE FROM reaction_role_mappings WHERE message_id = ?`, [messageId]);
}

"use strict";
// src/handlers/reactionRoleLoader.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReactionRoleMessage = saveReactionRoleMessage;
exports.saveReactionRoleMapping = saveReactionRoleMapping;
exports.getReactionRoleMessage = getReactionRoleMessage;
exports.getReactionRoleMappings = getReactionRoleMappings;
exports.deleteReactionRoleMessage = deleteReactionRoleMessage;
const database_1 = require("../database/database");
async function saveReactionRoleMessage(messageId, guildId, channelId, type, openingText, closingText) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT OR REPLACE INTO reaction_role_messages (message_id, guild_id, channel_id, type, opening_text, closing_text)
     VALUES (?, ?, ?, ?, ?, ?)`, [messageId, guildId, channelId, type, openingText, closingText]);
}
async function saveReactionRoleMapping(messageId, emoji, roleId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT OR REPLACE INTO reaction_role_mappings (message_id, emoji, role_id)
     VALUES (?, ?, ?)`, [messageId, emoji, roleId]);
}
async function getReactionRoleMessage(messageId) {
    const db = await (0, database_1.initDatabase)();
    const row = await db.get(`SELECT * FROM reaction_role_messages WHERE message_id = ?`, [messageId]);
    if (!row)
        return null;
    return {
        message_id: row.message_id,
        guild_id: row.guild_id,
        channel_id: row.channel_id,
        type: row.type,
        opening_text: row.opening_text ?? '',
        closing_text: row.closing_text ?? ''
    };
}
async function getReactionRoleMappings(messageId) {
    const db = await (0, database_1.initDatabase)();
    const rows = await db.all(`SELECT emoji, role_id FROM reaction_role_mappings WHERE message_id = ?`, [messageId]);
    const map = new Map();
    for (const row of rows) {
        map.set(row.emoji, row.role_id);
    }
    return map;
}
async function deleteReactionRoleMessage(messageId) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`DELETE FROM reaction_role_messages WHERE message_id = ?`, [messageId]);
    await db.run(`DELETE FROM reaction_role_mappings WHERE message_id = ?`, [messageId]);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logJoinDetail = logJoinDetail;
// src/automod/antiRaidDetailedLogs.ts
const database_1 = require("../database/database");
async function logJoinDetail(guildId, userId, joinScore, accountAgeDays, hasAvatar, rawData) {
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT INTO antiRaid_logs (guild_id, user_id, join_timestamp, join_score, account_age_days, has_avatar, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        guildId,
        userId,
        Date.now(),
        joinScore,
        accountAgeDays,
        hasAvatar,
        JSON.stringify(rawData)
    ]);
}

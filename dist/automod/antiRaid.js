"use strict";
// src/automod/antiRaid.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAntiRaidJoin = handleAntiRaidJoin;
exports.isGuildLocked = isGuildLocked;
exports.getRecentJoins = getRecentJoins;
const discord_js_1 = require("discord.js");
const securityConfig_1 = __importDefault(require("../config/securityConfig"));
const database_1 = require("../database/database");
const riskScore_1 = require("./riskScore");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const antiRaidDetailedLogs_1 = require("./antiRaidDetailedLogs");
const joinTimestamps = new Map();
const lockedGuilds = new Set();
const recentJoins = new Map();
// Các ngưỡng của AntiRaid được đặt trong config.antiNuke.antiRaid (ví dụ: scoreLimit)
function calculateJoinScore(member, guildId, joins) {
    const now = Date.now();
    let score = 0;
    const ageMinutes = (now - member.user.createdAt.getTime()) / (60 * 1000);
    const ageDays = ageMinutes / 1440;
    const avatar = member.user.avatar;
    const configRaid = securityConfig_1.default.antiNuke.antiRaid;
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
async function handleAntiRaidJoin(member) {
    const guild = member.guild;
    const guildId = guild.id;
    if (member.user.bot ||
        securityConfig_1.default.antiNuke.whitelistedUsers.includes(member.id) ||
        member.roles.cache.some(r => securityConfig_1.default.antiNuke.whitelistedRoles.includes(r.id)))
        return;
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
    const configRaid = securityConfig_1.default.antiNuke.antiRaid;
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
    await (0, antiRaidDetailedLogs_1.logJoinDetail)(guildId, member.id, score, ageDays, hasAvatar, { tag: member.user.tag, createdAt: member.user.createdAt });
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
    const scoreLimit = securityConfig_1.default.antiNuke.antiRaid?.scoreLimit || 50;
    if (totalScore >= scoreLimit && !lockedGuilds.has(guildId)) {
        await lockGuildPartial(guild);
        setTimeout(() => unlockGuildPartial(guild).catch(console.error), 5 * 60 * 1000);
    }
}
function lockGuildPartial(guild) {
    const guildId = guild.id;
    const everyone = guild.roles.everyone;
    lockedGuilds.add(guildId);
    const promises = [];
    for (const [, channel] of guild.channels.cache) {
        if (!channel.isTextBased?.() || [discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice].includes(channel.type))
            continue;
        const textChannel = channel;
        const perms = textChannel.permissionOverwrites.cache.get(everyone.id);
        if (perms?.deny.has(discord_js_1.PermissionsBitField.Flags.SendMessages))
            continue;
        promises.push(textChannel.permissionOverwrites.edit(everyone, {
            SendMessages: false,
            CreateInstantInvite: false
        }, { reason: 'AntiRaid: Lockdown tạm thời do join quá nhanh' }).catch(() => { }));
    }
    console.warn(`[AntiRaid] 🔒 Đã khóa một số kênh của server ${guild.name} theo chế độ lockdown từng phần.`);
    return Promise.all(promises).then(() => { });
}
function unlockGuildPartial(guild) {
    const everyone = guild.roles.everyone;
    const promises = [];
    for (const [, channel] of guild.channels.cache) {
        if (!channel.isTextBased?.() || [discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice].includes(channel.type))
            continue;
        const textChannel = channel;
        promises.push(textChannel.permissionOverwrites.edit(everyone, {
            SendMessages: null,
            CreateInstantInvite: null
        }, { reason: 'AntiRaid: Mở khóa sau lockdown từng phần' }).catch(() => { }));
    }
    lockedGuilds.delete(guild.id);
    console.log(`[AntiRaid] 🔓 Đã mở khóa server ${guild.name} từ chế độ lockdown từng phần.`);
    return Promise.all(promises).then(() => { });
}
function isGuildLocked(guildId) {
    return lockedGuilds.has(guildId);
}
function getRecentJoins(guildId) {
    return recentJoins.get(guildId) || [];
}
/**
 * Ghi log hành vi vào file và database.
 */
async function logBehavior(guild, user, event, count, target) {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${user.tag} (${user.id}) thực hiện ${discord_js_1.AuditLogEvent[event]} - Count: ${count}`;
    console.log('[AuditLog]', log);
    const logDir = path_1.default.join(__dirname, '../logs');
    if (!fs_1.default.existsSync(logDir))
        fs_1.default.mkdirSync(logDir);
    const logPath = path_1.default.join(logDir, `antinuke_${guild.id}.log`);
    fs_1.default.appendFileSync(logPath, log + '\n');
    const db = await (0, database_1.initDatabase)();
    await db.run(`INSERT INTO antinuke_logs (guild_id, user_id, username, event, target, count, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        guild.id,
        user.id,
        user.tag,
        discord_js_1.AuditLogEvent[event],
        target?.id || '',
        count,
        timestamp
    ]);
}
/**
 * Gửi cảnh báo qua kênh log và DM owner.
 */
async function sendAntiNukeAlert(guild, executor, event, count, target) {
    const logChannelId = securityConfig_1.default.restore?.logChannelId;
    const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;
    if (!logChannel || !logChannel.isTextBased())
        return;
    const totalScore = await (0, riskScore_1.getRiskScore)(guild.id, executor.id) ?? 0;
    const fields = [
        { name: 'Số lượng hành động', value: `${count}`, inline: true },
        { name: 'Điểm rủi ro hiện tại', value: `${totalScore}`, inline: true }
    ];
    if (target?.id) {
        fields.push({
            name: 'Đối tượng bị ảnh hưởng',
            value: `${target.name || target.id}`,
            inline: true
        });
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('Orange')
        .setTitle('⚠️ Hành vi nguy hiểm được phát hiện')
        .setDescription(`${executor.tag} (${executor.id}) đã thực hiện hành động **${discord_js_1.AuditLogEvent[event]}**.`)
        .addFields(fields)
        .setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => { });
    try {
        const owner = await guild.fetchOwner();
        if (owner) {
            await owner.send({
                content: `🚨 **CẢNH BÁO ANTI-NUKE**: ${executor.tag} vừa thực hiện hành động nguy hiểm: **${discord_js_1.AuditLogEvent[event]}** tại server ${guild.name}.`
            }).catch(() => { });
        }
    }
    catch (err) {
        console.warn('[AntiNuke] Không gửi được DM tới owner:', err);
    }
}

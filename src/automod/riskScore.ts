// src/automod/riskScore.ts

import { initDatabase } from '../database/database';
import config from '../config/securityConfig';

/**
 * Thêm điểm risk cho một người dùng dựa trên hành động.
 * Bạn có thể truyền thêm các tiêu chí (criteria) như tuổi tài khoản và có avatar hay không.
 */
export async function addRiskScore(
  guildId: string, 
  userId: string, 
  baseScore: number, 
  criteria?: { accountAgeDays?: number; hasAvatar?: boolean }
): Promise<void> {
  let weight = 1;
  if (criteria) {
    if (criteria.accountAgeDays !== undefined) {
      const threshold = config.adaptiveThreshold.accountAgeThreshold || 5;
      if (criteria.accountAgeDays < threshold) {
        weight += config.adaptiveThreshold.weightAccountAge || 2;
      }
    }
    if (criteria.hasAvatar === false) {
      weight += config.adaptiveThreshold.weightNoAvatar || 3;
    }
  }
  const score = baseScore * weight;
  const db = await initDatabase();
  const existing = await db.get(
    `SELECT * FROM risk_scores WHERE guild_id = ? AND user_id = ?`,
    [guildId, userId]
  );
  if (existing) {
    await db.run(
      `UPDATE risk_scores SET score = score + ?, last_updated = CURRENT_TIMESTAMP WHERE guild_id = ? AND user_id = ?`,
      [score, guildId, userId]
    );
  } else {
    await db.run(
      `INSERT INTO risk_scores (guild_id, user_id, score, last_updated) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [guildId, userId, score]
    );
  }
}

/**
 * Lấy điểm risk hiện tại của một người dùng.
 */
export async function getRiskScore(guildId: string, userId: string): Promise<number> {
  const db = await initDatabase();
  const row = await db.get(`SELECT score FROM risk_scores WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
  return row?.score || 0;
}

/**
 * Giảm điểm risk theo exponential decay.
 * newScore = currentScore * exp(-λ * Δt)
 * Trong đó Δt tính theo giờ.
 */
export async function reduceRiskScoresOverTime(): Promise<void> {
  const db = await initDatabase();
  const lambda = config.adaptiveThreshold.decayLambda || 0.1;
  const rows = await db.all(`SELECT guild_id, user_id, score, last_updated FROM risk_scores`);
  const now = new Date();
  for (const row of rows) {
    const lastUpdated = new Date(row.last_updated);
    const deltaHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    const newScore = row.score * Math.exp(-lambda * deltaHours);
    await db.run(
      `UPDATE risk_scores SET score = ?, last_updated = CURRENT_TIMESTAMP WHERE guild_id = ? AND user_id = ?`,
      [newScore, row.guild_id, row.user_id]
    );
  }
}

/**
 * Tính toán adaptive threshold dựa trên risk score của tất cả người dùng trong guild.
 * Sử dụng công thức: threshold = mean + k * stdDev
 * Nếu không có dữ liệu, trả về baseThreshold từ config.
 */
export async function getAdaptiveThreshold(guildId: string): Promise<number> {
  const db = await initDatabase();
  type ScoreRow = { score: number };
  const rows = await db.all<ScoreRow[]>(
    `SELECT score FROM risk_scores WHERE guild_id = ?`,
    [guildId]
  );
  if (!rows || rows.length === 0) {
    return config.adaptiveThreshold.baseThreshold ?? 25;
  }
  const scores = rows.map(r => r.score);
  const mean = scores.reduce((acc, val) => acc + val, 0) / scores.length;
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const k = config.adaptiveThreshold.k || 1.5;
  return mean + k * stdDev;
}

/**
 * Tính moving average risk score của tất cả người dùng trong guild.
 * Bạn có thể dùng hàm này cho việc hiển thị thống kê cho admin.
 */
export async function calculateMovingAverageRisk(guildId: string): Promise<number> {
  const db = await initDatabase();
  type ScoreRow = { score: number };
  const rows = await db.all<ScoreRow[]>(`SELECT score FROM risk_scores WHERE guild_id = ?`, [guildId]);
  if (!rows || rows.length === 0) return config.adaptiveThreshold.baseThreshold ?? 25;
  const scores = rows.map(r => r.score);
  const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  return mean;
}

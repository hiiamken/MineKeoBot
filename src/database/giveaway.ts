import { initDatabase } from './database';

/**
 * 🏆 Tạo Giveaway mới
 */
export async function startGiveawayNumber(
  messageId: string,  
  guildId: string,
  channelId: string,
  prize: string,
  winnersCount: number,
  endTime: number,
  hostId = 'unknown',
  requireRole = '',
  requireLevel = 0,
  requireMoney = 0,
  requireInvite = 0,
  bonusJSON = ''
) {
  const db = await initDatabase();

  await db.run(
    `INSERT INTO giveaways (
      message_id, guild_id, channel_id, host_id, prize,
      winners_count, end_time, status,
      require_role, require_level, require_money, require_invite, bonus_roles
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ongoing', ?, ?, ?, ?, ?)`,
    [
      messageId, 
      guildId, 
      channelId,
      hostId,
      prize,
      winnersCount,
      endTime,
      requireRole,
      requireLevel,
      requireMoney,
      requireInvite,
      bonusJSON
    ]
  );
}

/**
 * 🔍 Lấy Giveaway Đang Diễn Ra theo `messageId`
 */
export async function getActiveGiveaway(guildId: string, messageId: string) {
  const db = await initDatabase();

  const result = await db.get(
    `SELECT * FROM giveaways WHERE guild_id = ? AND message_id = ? AND status = 'ongoing'`,
    [guildId, messageId]
  );

  return result;
}

/**
 * 📌 Lấy Tất Cả Giveaway Đang Diễn Ra
 */
export async function getAllOngoingGiveaways() {
  const db = await initDatabase();
  return db.all(`SELECT * FROM giveaways WHERE status = 'ongoing'`);
}

/**
 * 🛠 Cập Nhật Participants vào Cột `giveaways.participants`
 */
export async function updateGiveawayParticipants(guildId: string, messageId: string, participants: string[]) {
  const db = await initDatabase();
  const participantsJSON = JSON.stringify(participants);

  await db.run(
    `UPDATE giveaways SET participants = ? WHERE guild_id = ? AND message_id = ?`,
    [participantsJSON, guildId, messageId]
  );
}

/**
 * ⏳ Kết Thúc Giveaway (Đặt `status = 'ended'`)
 */
export async function endGiveaway(guildId: string, messageId: string) {
  const db = await initDatabase();

  try {
    // ✅ Chỉ thêm cột `participants` nếu chưa tồn tại
    await db.run(`ALTER TABLE giveaways ADD COLUMN participants TEXT DEFAULT '[]'`);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes("duplicate column name")) {
      console.error("❌ Lỗi khi thêm cột participants:", error);
    }
  }
  const participants = await db.all(
    `SELECT user_id FROM giveaway_participants WHERE message_id = ?`,
    [messageId]
  );

  const participantsJSON = JSON.stringify(participants.map(p => p.user_id));

  // 🔹 Cập nhật trạng thái giveaway
  await db.run(
    `UPDATE giveaways 
     SET status = 'ended', participants = ? 
     WHERE guild_id = ? AND message_id = ?`,
    [participantsJSON, guildId, messageId]
  );
}

/**
 * 🔄 Cập Nhật Trạng Thái Giveaway (pause, resume...)
 */
export async function updateGiveawayStatus(
  guildId: string,
  messageId: string,
  status: string
) {
  const db = await initDatabase();
  await db.run(
    `UPDATE giveaways SET status = ? WHERE guild_id = ? AND message_id = ?`,
    [status, guildId, messageId]
  );
}

/**
 * 🎲 Reroll (Chọn Người Thắng Mới Ngẫu Nhiên)
 */
export async function rerollWinner(guildId: string, messageId: string, winnersCount: number) {
  const db = await initDatabase();
  return db.all(
    `SELECT user_id FROM giveaway_participants 
     WHERE guild_id = ? AND message_id = ? 
     ORDER BY RANDOM() LIMIT ?`,
    [guildId, messageId, winnersCount]
  );
}

/**
 * 🔍 Lấy Giveaway Theo `messageId`
 */
export async function getGiveawayByMessageId(guildId: string, messageId: string) {
  const db = await initDatabase();
  return db.get(
    `SELECT * FROM giveaways WHERE guild_id = ? AND message_id = ?`,
    [guildId, messageId]
  );
}

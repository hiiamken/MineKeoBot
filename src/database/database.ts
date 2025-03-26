import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

sqlite3.verbose();

// Sử dụng biến singleton để cache instance của database
let dbInstance: Database | null = null;

/**
 * Hàm khởi tạo database và tạo các bảng cần thiết nếu chưa tồn tại.
 * Nếu đã được khởi tạo rồi thì trả về instance đã lưu.
 */
export async function initDatabase(): Promise<Database> {
  // Nếu đã có instance, trả về luôn
  if (dbInstance) return dbInstance;

  // Khởi tạo database mới
  dbInstance = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // 📌 **Bảng lưu cấp độ của người dùng**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS levels (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  // 📌 **Bảng lưu dữ liệu tiền tệ (VNĐ)**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS economy (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      money INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  // Kiểm tra xem cột 'bank' đã tồn tại chưa và thêm nếu chưa
  const columnsInfo = await dbInstance.all(`PRAGMA table_info(economy)`);
  const bankColumnExists = columnsInfo.some((column) => column.name === "bank");

  if (!bankColumnExists) {
    await dbInstance.exec(
      `ALTER TABLE economy ADD COLUMN bank INTEGER NOT NULL DEFAULT 0;`
    );
  }

  // 📌 **Bảng lưu cảnh cáo người dùng**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT DEFAULT 'Không có lý do',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 📌 **Bảng lưu số tin nhắn đã gửi**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  // 📌 **Bảng lưu số lần mời người khác**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS invites (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      invite_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  // 📌 **Bảng lưu thời gian voice channel**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS voicetimes (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      total_time INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id, channel_id)
    );
  `);

  // 📌 **Bảng lưu lịch sử vi phạm (Ban, Kick, Mute, Unban, Unmute, Purge)**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS infractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT DEFAULT 'Không có lý do',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration TEXT,
      fine INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 📌 **Bảng lưu cảnh cáo người dùng (Warns)**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT DEFAULT 'Không có lý do',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      warn_count INTEGER NOT NULL DEFAULT 1,
      fine INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 📌 **Bảng lưu thông tin Giveaway**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS giveaways (
      message_id TEXT PRIMARY KEY,  
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      host_id TEXT NOT NULL,
      prize TEXT NOT NULL,
      winners_count INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ongoing', 
      paused INTEGER NOT NULL DEFAULT 0,     
      require_role TEXT DEFAULT '',
      require_level INTEGER NOT NULL DEFAULT 0,
      require_money INTEGER NOT NULL DEFAULT 0,
      require_invite INTEGER NOT NULL DEFAULT 0,
      bonus_roles TEXT DEFAULT '',
      participants TEXT DEFAULT '[]'
    );
  `);

  // 📌 **Bảng lưu người tham gia Giveaway**
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS giveaway_participants (
      message_id TEXT NOT NULL,  
      user_id TEXT NOT NULL,
      has_won INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (message_id, user_id),
      FOREIGN KEY (message_id) REFERENCES giveaways(message_id) ON DELETE CASCADE
    );
  `);

  // 📌 **Bảng lưu xác minh người dùng**
  await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS verify_log (
    user_id TEXT PRIMARY KEY,
    verified_at INTEGER
  );
`);

  // 📌 **Bảng lưu các link người dùng đã xác nhận là hợp lệ**
  await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS link_confirmations (
    user_id TEXT NOT NULL,
    link TEXT NOT NULL,
    confirmed_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, link)
  );
`);

  // --- Backup tables ---
  await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT,
    note TEXT
  );
  CREATE TABLE IF NOT EXISTS roles (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    name TEXT,
    color INTEGER,
    permissions TEXT,
    position INTEGER,
    hoist INTEGER,
    mentionable INTEGER,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS channels (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    name TEXT,
    type TEXT,
    parent_id TEXT,
    position INTEGER,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS channel_permissions (
  backup_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  target_id TEXT NOT NULL,  
  target_type TEXT NOT NULL, 
  allow TEXT NOT NULL,      
  deny TEXT NOT NULL,       
  PRIMARY KEY (backup_id, guild_id, channel_id, target_id)
);
CREATE TABLE IF NOT EXISTS antinuke_detailed_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  before_data TEXT,  
  after_data TEXT,  
  timestamp INTEGER 
);
CREATE TABLE IF NOT EXISTS antiRaid_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  join_timestamp INTEGER NOT NULL,
  join_score REAL NOT NULL,
  account_age_days REAL,
  has_avatar INTEGER, 
  raw_data TEXT,      
  processed INTEGER DEFAULT 0,
  action_status TEXT DEFAULT 'pending'
);
  CREATE TABLE IF NOT EXISTS role_assignments (
    backup_id TEXT,
    guild_id TEXT,
    user_id TEXT,
    role_id TEXT,
    assigned_at TEXT
  );
  CREATE TABLE IF NOT EXISTS nicknames (
    backup_id TEXT,
    guild_id TEXT,
    user_id TEXT,
    nickname TEXT,
    changed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS bans (
    backup_id TEXT,
    guild_id TEXT,
    user_id TEXT,
    reason TEXT,
    banned_at TEXT
  );
  CREATE TABLE IF NOT EXISTS messages_backup (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    content TEXT,
    attachments TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS threads (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    channel_id TEXT,
    name TEXT,
    created_at TEXT,
    archived INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS forum_posts (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    content TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS emojis (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    name TEXT,
    animated INTEGER,
    url TEXT
  );
  CREATE TABLE IF NOT EXISTS webhooks (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    channel_id TEXT,
    name TEXT,
    type TEXT,
    token TEXT
  );
  CREATE TABLE IF NOT EXISTS integrations (
    backup_id TEXT,
    id TEXT,
    guild_id TEXT,
    name TEXT,
    type TEXT,
    enabled INTEGER
  );
  CREATE TABLE IF NOT EXISTS restore_logs (
    guild_id TEXT,
    backup_id TEXT,
    action TEXT,
    timestamp TEXT
  );
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  auto_backup INTEGER NOT NULL DEFAULT 0
);
`);

  // 📌 Bảng Risk Score (ghi điểm rủi ro mỗi người dùng trong server)
  await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS risk_scores (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    last_updated TEXT,
    PRIMARY KEY (guild_id, user_id)
  );
`);

await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS reaction_role_messages (
      message_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      type TEXT NOT NULL,
      opening_text TEXT,
      closing_text TEXT
    );
    CREATE TABLE IF NOT EXISTS reaction_role_mappings (
      message_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (message_id, emoji)
    );
  `);

  await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS antinuke_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    event TEXT NOT NULL,
    target TEXT,
    count INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

  console.log("✅ SQLite database has been initialized.");
  return dbInstance;
}

/**
 * Hàm ghi log vi phạm (ban, kick, mute, unban, unmute, purge)
 */
export async function logInfraction(
  guildId: string,
  userId: string,
  moderatorId: string,
  action: string,
  reason: string = "Không có lý do",
  duration: string = "",
  fine: number = 0
) {
  const db = await initDatabase();
  await db.run(
    `INSERT INTO infractions (guild_id, user_id, moderator_id, action, reason, duration, fine) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [guildId, userId, moderatorId, action, reason, duration, fine]
  );
}

/**
 * Hàm ghi nhận cảnh cáo (warn)
 */
export async function logWarning(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string = "Không có lý do",
  fine: number = 0
) {
  const db = await initDatabase();
  await db.run(
    `INSERT INTO warns (guild_id, user_id, moderator_id, reason, fine) VALUES (?, ?, ?, ?, ?)`,
    [guildId, userId, moderatorId, reason, fine]
  );
}

/**
 * Lấy lịch sử xử lý vi phạm của một người dùng trong server
 */
export async function getInfractions(guildId: string, userId: string) {
  const db = await initDatabase();
  return db.all(
    `SELECT * FROM infractions WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT 10`,
    [guildId, userId]
  );
}

/**
 * Lấy danh sách cảnh cáo của người dùng
 */
export async function getUserWarnings(guildId: string, userId: string) {
  const db = await initDatabase();
  return db.all(
    `SELECT * FROM warns WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT 10`,
    [guildId, userId]
  );
}

/**
 * Xóa toàn bộ log vi phạm của một người dùng
 */
export async function clearInfractions(guildId: string, userId: string) {
  const db = await initDatabase();
  await db.run(`DELETE FROM infractions WHERE guild_id = ? AND user_id = ?`, [
    guildId,
    userId,
  ]);
  await db.run(`DELETE FROM warns WHERE guild_id = ? AND user_id = ?`, [
    guildId,
    userId,
  ]);
}

/**
 * Xóa toàn bộ cảnh cáo của người dùng
 */
export async function clearUserWarnings(guildId: string, userId: string) {
  const db = await initDatabase();
  await db.run(`DELETE FROM warns WHERE guild_id = ? AND user_id = ?`, [
    guildId,
    userId,
  ]);
}

/**
 * Lấy toàn bộ lịch sử vi phạm trong hệ thống
 */
export async function getAllInfractions() {
  const db = await initDatabase();
  return db.all(`SELECT * FROM infractions ORDER BY timestamp DESC LIMIT 100`);
}

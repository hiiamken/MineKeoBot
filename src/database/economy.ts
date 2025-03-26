import { initDatabase } from './database';

/**
 * Điều chỉnh số dư của người dùng (có thể cộng hoặc trừ)
 * @param guildId ID của máy chủ
 * @param userId ID của người dùng
 * @param amount Số tiền thay đổi (có thể âm để trừ)
 * @returns Số dư mới sau khi thay đổi
 */
export async function adjustBalance(guildId: string, userId: string, amount: number): Promise<number> {
  const db = await initDatabase();

  // Lấy số dư hiện tại của người dùng
  const row = await db.get(`SELECT money FROM economy WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
  let currentBalance = row ? row.money : 0;
  let newBalance = currentBalance + amount; // Cho phép số dư âm nếu trừ quá mức

  // Cập nhật số dư mới vào database
  await db.run(
    `INSERT INTO economy (guild_id, user_id, money) VALUES (?, ?, ?) 
     ON CONFLICT(guild_id, user_id) DO UPDATE SET money = ?`,
    [guildId, userId, newBalance, newBalance]
  );

  return newBalance;
}

/**
 * Lấy số dư hiện tại của người dùng
 * @param guildId ID của máy chủ
 * @param userId ID của người dùng
 * @returns Số dư hiện tại
 */
export async function getBalance(guildId: string, userId: string): Promise<number> {
  const db = await initDatabase();
  const row = await db.get(`SELECT money FROM economy WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
  return row ? row.money : 0;
}

/**
 * Kiểm tra nếu người dùng có đủ tiền
 * @param guildId ID của máy chủ
 * @param userId ID của người dùng
 * @param amount Số tiền cần kiểm tra
 * @returns True nếu có đủ tiền, False nếu không
 */
export async function hasEnoughBalance(guildId: string, userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(guildId, userId);
  return balance >= amount;
}


/**
 * Lấy danh sách top 10 người có nhiều tiền nhất
 * @param guildId ID của máy chủ
 * @param limit Số người muốn lấy (mặc định: 10)
 * @returns Danh sách top người có nhiều tiền
 */
export async function getTopBalances(guildId: string, limit: number = 10) {
  const db = await initDatabase();
  return db.all(
      `SELECT user_id, money FROM economy WHERE guild_id = ? ORDER BY money DESC LIMIT ?`,
      [guildId, limit]
  );
}

/**
 * Điều chỉnh số dư ngân hàng của người dùng (có thể cộng hoặc trừ)
 * @param guildId ID của máy chủ
 * @param userId ID của người dùng
 * @param amount Số tiền thay đổi (có thể âm để trừ)
 * @returns Số dư ngân hàng mới sau khi thay đổi
 */
export async function adjustBankBalance(guildId: string, userId: string, amount: number): Promise<number> {
  const db = await initDatabase();

  // Lấy số dư ngân hàng hiện tại của người dùng
  const row = await db.get(`SELECT bank FROM economy WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
  let currentBalance = row ? row.bank : 0;
  let newBalance = currentBalance + amount; // Cho phép số dư âm nếu trừ quá mức

  // Cập nhật số dư ngân hàng mới vào database
  await db.run(
    `INSERT INTO economy (guild_id, user_id, bank) VALUES (?, ?, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET bank = ?`,
    [guildId, userId, newBalance, newBalance]
  );

  return newBalance;
}

/**
 * Lấy số dư ngân hàng hiện tại của người dùng
 * @param guildId ID của máy chủ
 * @param userId ID của người dùng
 * @returns Số dư ngân hàng hiện tại
 */
export async function getBankBalance(guildId: string, userId: string): Promise<number> {
  const db = await initDatabase();
  const row = await db.get(`SELECT bank FROM economy WHERE guild_id = ? AND user_id = ?`, [guildId, userId]);
  return row ? row.bank : 0;
}

/**
 * Kiểm tra nếu người dùng có đủ tiền trong ngân hàng
 * @param guildId ID của máy chủ
 * @param userId ID của người dùng
 * @param amount Số tiền cần kiểm tra
 * @returns True nếu có đủ tiền, False nếu không
 */
export async function hasEnoughBankBalance(guildId: string, userId: string, amount: number): Promise<boolean> {
  const balance = await getBankBalance(guildId, userId);
  return balance >= amount;
}

/**
 * Lấy danh sách top 10 người có nhiều tiền trong ngân hàng nhất
 * @param guildId ID của máy chủ
 * @param limit Số người muốn lấy (mặc định: 10)
 * @returns Danh sách top người có nhiều tiền trong ngân hàng
 */
export async function getTopBankBalances(guildId: string, limit: number = 10) {
  const db = await initDatabase();
  return db.all(
    `SELECT user_id, bank FROM economy WHERE guild_id = ? ORDER BY bank DESC LIMIT ?`,
    [guildId, limit]
  );
}
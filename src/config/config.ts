// src/config/config.ts
import fs from 'fs';
import path from 'path';
import { GuildMember } from 'discord.js';

const configPath = path.join(__dirname, 'config.json');

interface ConfigData {
  welcomeChannels: { [guildId: string]: string };
  autorole: { [guildId: string]: string }; // Thêm trường cho autorole
  adminUserId: string;
  ownerRoleId: string;
  managerRoleId: string;
  adminRoleId: string;
  prefix: string;
}

// Dữ liệu cấu hình mặc định
let configData: ConfigData = {
  welcomeChannels: {},
  autorole: {}, // Khởi tạo với object rỗng
  adminUserId: "453380710024347658",
  ownerRoleId: "1178278042053910558",
  managerRoleId: "1121667704298946600",
  adminRoleId: "1180041593928032306",
  prefix: "!",
};

/**
 * Load config từ file JSON nếu có, nếu không sẽ tạo file mới.
 */
function loadConfig(): void {
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      configData = { ...configData, ...JSON.parse(raw) as Partial<ConfigData> };
    } catch (error) {
      console.error("⚠ Lỗi khi đọc file config.json, tạo file mới.", error);
      saveConfig();
    }
  } else {
    saveConfig();
  }
}

/**
 * Lưu config xuống file JSON
 */
function saveConfig(): void {
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
}

/**
 * Thiết lập prefix mới
 */
export function setPrefix(newPrefix: string): void {
  configData.prefix = newPrefix;
  saveConfig();
}

/**
 * Lấy prefix hiện tại
 */
export function getPrefix(): string {
  return configData.prefix;
}

/**
 * Kiểm tra quyền sử dụng lệnh dựa trên role và so sánh quyền hạn giữa hai người dùng.
 * @param user Người thực thi lệnh
 * @param target Người bị ảnh hưởng (tùy chọn)
 * @returns true nếu có quyền, false nếu không có
 */
export function hasPermission(user: GuildMember, target?: GuildMember): boolean {
  if (!user || !user.roles) return false;

  const roles = user.roles.cache;
  const isAdmin = user.id === configData.adminUserId || roles.has(configData.adminRoleId);
  const isOwner = roles.has(configData.ownerRoleId);
  const isManager = roles.has(configData.managerRoleId);

  if (!target) {
    return isAdmin || isOwner || isManager;
  }

  const targetRoles = target.roles.cache;
  const targetIsAdmin = target.id === configData.adminUserId || targetRoles.has(configData.adminRoleId);
  const targetIsOwner = targetRoles.has(configData.ownerRoleId);
  const targetIsManager = targetRoles.has(configData.managerRoleId);

  if (user.id === configData.adminUserId) return true;
  if (isOwner && !targetIsOwner) return true;
  if (isManager && !targetIsManager && !targetIsOwner) return true;
  if (isAdmin && !targetIsAdmin && !targetIsManager && !targetIsOwner) return true;

  return false;
}

/**
 * Thiết lập kênh chào mừng cho server
 */
export function setWelcomeChannel(guildId: string, channelId: string): void {
  configData.welcomeChannels[guildId] = channelId;
  saveConfig();
}

/**
 * Lấy ID kênh chào mừng của server
 */
export function getWelcomeChannel(guildId: string): string | null {
  return configData.welcomeChannels[guildId] || null;
}

/**
 * Thiết lập Admin User ID
 */
export function setAdminUserId(userId: string): void {
  configData.adminUserId = userId;
  saveConfig();
}

/**
 * Lấy Admin User ID
 */
export function getAdminUserId(): string {
  return configData.adminUserId;
}

/**
 * Thiết lập autorole cho server (role sẽ được gán tự động cho member mới)
 */
export function setAutorole(guildId: string, roleId: string): void {
  configData.autorole[guildId] = roleId;
  saveConfig();
}

/**
 * Lấy ID autorole của server
 */
export function getAutorole(guildId: string): string | null {
  return configData.autorole[guildId] || null;
}

// Load config ngay khi khởi động
loadConfig();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrefix = setPrefix;
exports.getPrefix = getPrefix;
exports.hasPermission = hasPermission;
exports.setWelcomeChannel = setWelcomeChannel;
exports.getWelcomeChannel = getWelcomeChannel;
exports.setAdminUserId = setAdminUserId;
exports.getAdminUserId = getAdminUserId;
exports.setAutorole = setAutorole;
exports.getAutorole = getAutorole;
// src/config/config.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const configPath = path_1.default.join(__dirname, 'config.json');
// Dữ liệu cấu hình mặc định
let configData = {
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
function loadConfig() {
    if (fs_1.default.existsSync(configPath)) {
        try {
            const raw = fs_1.default.readFileSync(configPath, 'utf8');
            configData = { ...configData, ...JSON.parse(raw) };
        }
        catch (error) {
            console.error("⚠ Lỗi khi đọc file config.json, tạo file mới.", error);
            saveConfig();
        }
    }
    else {
        saveConfig();
    }
}
/**
 * Lưu config xuống file JSON
 */
function saveConfig() {
    fs_1.default.writeFileSync(configPath, JSON.stringify(configData, null, 2));
}
/**
 * Thiết lập prefix mới
 */
function setPrefix(newPrefix) {
    configData.prefix = newPrefix;
    saveConfig();
}
/**
 * Lấy prefix hiện tại
 */
function getPrefix() {
    return configData.prefix;
}
/**
 * Kiểm tra quyền sử dụng lệnh dựa trên role và so sánh quyền hạn giữa hai người dùng.
 * @param user Người thực thi lệnh
 * @param target Người bị ảnh hưởng (tùy chọn)
 * @returns true nếu có quyền, false nếu không có
 */
function hasPermission(user, target) {
    if (!user || !user.roles)
        return false;
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
    if (user.id === configData.adminUserId)
        return true;
    if (isOwner && !targetIsOwner)
        return true;
    if (isManager && !targetIsManager && !targetIsOwner)
        return true;
    if (isAdmin && !targetIsAdmin && !targetIsManager && !targetIsOwner)
        return true;
    return false;
}
/**
 * Thiết lập kênh chào mừng cho server
 */
function setWelcomeChannel(guildId, channelId) {
    configData.welcomeChannels[guildId] = channelId;
    saveConfig();
}
/**
 * Lấy ID kênh chào mừng của server
 */
function getWelcomeChannel(guildId) {
    return configData.welcomeChannels[guildId] || null;
}
/**
 * Thiết lập Admin User ID
 */
function setAdminUserId(userId) {
    configData.adminUserId = userId;
    saveConfig();
}
/**
 * Lấy Admin User ID
 */
function getAdminUserId() {
    return configData.adminUserId;
}
/**
 * Thiết lập autorole cho server (role sẽ được gán tự động cho member mới)
 */
function setAutorole(guildId, roleId) {
    configData.autorole[guildId] = roleId;
    saveConfig();
}
/**
 * Lấy ID autorole của server
 */
function getAutorole(guildId) {
    return configData.autorole[guildId] || null;
}
// Load config ngay khi khởi động
loadConfig();

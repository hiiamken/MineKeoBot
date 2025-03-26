"use strict";
// src/utils/updateSecurityConfig.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSecurityConfig = updateSecurityConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const securityConfig_1 = __importDefault(require("../config/securityConfig"));
const configPath = path_1.default.resolve(process.cwd(), 'securityConfig.json');
// Đồng bộ .ts => .json nếu .json chưa tồn tại hoặc bị lỗi
function syncFromTSConfig() {
    const data = JSON.stringify(securityConfig_1.default, null, 2);
    fs_1.default.writeFileSync(configPath, data);
    console.log('[ConfigSync] Đã tạo mới securityConfig.json từ securityConfig.ts');
}
async function updateSecurityConfig(newConfig) {
    let current = {};
    if (!fs_1.default.existsSync(configPath)) {
        syncFromTSConfig();
        current = securityConfig_1.default;
    }
    else {
        try {
            current = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        }
        catch (e) {
            console.warn('[ConfigSync] ⚠️ Lỗi đọc securityConfig.json, sẽ tạo lại từ bản gốc.');
            syncFromTSConfig();
            current = securityConfig_1.default;
        }
    }
    const merged = {
        ...current,
        ...newConfig,
        antiNuke: {
            ...current.antiNuke,
            ...newConfig.antiNuke,
        },
        restore: {
            ...current.restore,
            ...newConfig.restore,
        },
        backup: {
            ...current.backup,
            ...newConfig.backup,
        },
    };
    fs_1.default.writeFileSync(configPath, JSON.stringify(merged, null, 2));
}

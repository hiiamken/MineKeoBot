"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackupIds = getBackupIds;
// src/utils/getBackupIds.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getBackupIds(guildId) {
    const backupDir = path_1.default.join(__dirname, '..', 'backups', guildId);
    if (!fs_1.default.existsSync(backupDir))
        return [];
    const files = fs_1.default.readdirSync(backupDir);
    return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
}

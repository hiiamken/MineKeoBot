"use strict";
// src/automod/verifyBackupFile.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBackupFile = verifyBackupFile;
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const readFileAsync = (0, util_1.promisify)(fs_1.default.readFile);
async function verifyBackupFile(guildId, backupId) {
    const backupDir = path_1.default.join(process.cwd(), 'backups');
    const filePath = path_1.default.join(backupDir, `${backupId}.json`);
    try {
        const content = await readFileAsync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        const expectedChecksum = parsed.backupInfo?.checksum;
        if (!expectedChecksum) {
            console.warn('Backup file không có checksum.');
            return false;
        }
        // Tính lại checksum trên nội dung file đã đọc
        const computedChecksum = crypto_1.default.createHash('sha256').update(content).digest('hex');
        if (computedChecksum === expectedChecksum) {
            console.log('Checksum khớp.');
            return true;
        }
        else {
            console.warn('Checksum không khớp. File backup có thể bị hỏng.');
            return false;
        }
    }
    catch (error) {
        console.error('Lỗi khi kiểm tra backup file:', error);
        return false;
    }
}

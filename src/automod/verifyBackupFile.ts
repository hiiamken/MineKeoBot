// src/automod/verifyBackupFile.ts

import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import crypto from 'crypto';

const readFileAsync = promisify(fs.readFile);

export async function verifyBackupFile(guildId: string, backupId: string): Promise<boolean> {
  const backupDir = path.join(process.cwd(), 'backups');
  const filePath = path.join(backupDir, `${backupId}.json`);
  try {
    const content = await readFileAsync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    const expectedChecksum = parsed.backupInfo?.checksum;
    if (!expectedChecksum) {
      console.warn('Backup file không có checksum.');
      return false;
    }
    // Tính lại checksum trên nội dung file đã đọc
    const computedChecksum = crypto.createHash('sha256').update(content).digest('hex');
    if (computedChecksum === expectedChecksum) {
      console.log('Checksum khớp.');
      return true;
    } else {
      console.warn('Checksum không khớp. File backup có thể bị hỏng.');
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra backup file:', error);
    return false;
  }
}

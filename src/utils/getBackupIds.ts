// src/utils/getBackupIds.ts
import fs from 'fs';
import path from 'path';

export function getBackupIds(guildId: string): string[] {
  const backupDir = path.join(__dirname, '..', 'backups', guildId);
  if (!fs.existsSync(backupDir)) return [];

  const files = fs.readdirSync(backupDir);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

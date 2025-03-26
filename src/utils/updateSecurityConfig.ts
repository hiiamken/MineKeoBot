// src/utils/updateSecurityConfig.ts

import fs from 'fs';
import path from 'path';
import tsconfig from '../config/securityConfig';

const configPath = path.resolve(process.cwd(), 'securityConfig.json');

// Đồng bộ .ts => .json nếu .json chưa tồn tại hoặc bị lỗi
function syncFromTSConfig(): void {
  const data = JSON.stringify(tsconfig, null, 2);
  fs.writeFileSync(configPath, data);
  console.log('[ConfigSync] Đã tạo mới securityConfig.json từ securityConfig.ts');
}

export async function updateSecurityConfig(newConfig: any): Promise<void> {
  let current: any = {};

  if (!fs.existsSync(configPath)) {
    syncFromTSConfig();
    current = tsconfig;
  } else {
    try {
      current = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.warn('[ConfigSync] ⚠️ Lỗi đọc securityConfig.json, sẽ tạo lại từ bản gốc.');
      syncFromTSConfig();
      current = tsconfig;
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

  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
}

import { Message } from 'discord.js';
import { automodConfig } from '../config/automodConfig';
import fs from 'fs';
import path from 'path';

const domainListPath = path.join(__dirname, '../config/domain-list.json');
const suspiciousListPath = path.join(__dirname, '../config/suspicious-list.json');

let scamDomains: string[] = [];

// 🚀 Load danh sách domain scam & suspicious
function loadScamDomains() {
  try {
    const domainData = JSON.parse(fs.readFileSync(domainListPath, 'utf8'));
    const suspiciousData = JSON.parse(fs.readFileSync(suspiciousListPath, 'utf8'));
    
    if (Array.isArray(domainData.domains)) {
      scamDomains = scamDomains.concat(domainData.domains);
    }

    if (Array.isArray(suspiciousData.domains)) {
      scamDomains = scamDomains.concat(suspiciousData.domains);
    }

    console.log(`✅ Đã tải ${scamDomains.length} domain scam từ JSON.`);
  } catch (error) {
    console.error('❌ Lỗi khi tải danh sách link scam:', error);
  }
}

loadScamDomains();

/**
 * ✅ Kiểm tra tin nhắn vi phạm quy định nghiêm trọng
 */
export function checkAutomodViolation(message: Message): { reason: string; penalty: string } | null {
  if (!message.guild) return null;
  const content = message.content.toLowerCase();

  // 1️⃣ Chửi bậy
  if (automodConfig.bannedWords.some((word: string) => content.includes(word))) {
    return { reason: 'Sử dụng từ ngữ không phù hợp', penalty: 'mute' };
  }

  // 2️⃣ Gửi link invite
  if (automodConfig.blockInvites && /(discord\.gg|discordapp\.com\/invite)/.test(content)) {
    return { reason: 'Gửi link invite trái phép', penalty: 'mute' };
  }

  // 3️⃣ Gửi link scam (từ domain-list.json)
  if (scamDomains.some(domain => content.includes(domain))) {
    return { reason: 'Gửi link scam', penalty: 'ban' };
  }

  // 4️⃣ IN HOA quá nhiều
  const uppercaseCount = message.content.replace(/[^A-Z]/g, '').length;
  if (uppercaseCount > 10 && (uppercaseCount / message.content.length) * 100 > automodConfig.maxCapsLimit) {
    return { reason: 'Sử dụng quá nhiều chữ IN HOA', penalty: 'mute' };
  }

  return null;
}

/**
 * 📌 Kiểm tra xem tin nhắn có chứa link đáng ngờ không
 * Nhưng KHÔNG thuộc các dạng link đã bị cấm hoàn toàn
 */
export function isSuspiciousLink(message: Message): boolean {
  const content = message.content.toLowerCase();
  if (!content.includes("http")) return false;

  // Nếu không phải link invite / link scam thì coi là nghi ngờ
  const inviteRegex = /(discord\.gg|discordapp\.com\/invite)/;
  const knownScam = scamDomains.some(domain => content.includes(domain));

  return !inviteRegex.test(content) && !knownScam;
}


// src/utils/parseRolesData.ts

export function parseRolesData(rolesData: string) {
    const lines = rolesData.split('\n').map(l => l.trim()).filter(Boolean);
    const results: { roleId: string; icon: string; desc: string }[] = [];
  
    for (const line of lines) {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 3) {
        console.warn(`Dòng không đúng định dạng (thiếu '|'): "${line}"`);
        continue;
      }
      let roleId = parts[0];
      const icon = parts[1];
      const desc = parts.slice(2).join('|'); // Hợp nhất các phần còn lại thành mô tả
      // Nếu roleId ở dạng mention: <@&123456>
      if (roleId.startsWith('<@&') && roleId.endsWith('>')) {
        roleId = roleId.replace(/[<@&>]/g, '');
      }
      results.push({ roleId, icon, desc });
    }
    return results;
  }
  
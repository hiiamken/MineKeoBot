import { GuildMember } from 'discord.js';
import { getAutorole } from '../config/config'; // Hàm lấy role từ config hoặc database

export async function handleAutorole(member: GuildMember): Promise<void> {
  try {
    // Lấy role autorole từ cấu hình
    const autoroleId = getAutorole(member.guild.id);
    if (!autoroleId) {
      return;
    }

    // Gán role cho thành viên mới
    const role = member.guild.roles.cache.get(autoroleId);
    if (role) {
      await member.roles.add(role);
    } else {
    }
  } catch (error) {
  }
}

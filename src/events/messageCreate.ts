import { Message, TextChannel, DMChannel, ThreadChannel } from 'discord.js';
import { getPrefix } from '../config/config';
import { loadPrefixCommands } from '../handlers/commandLoader';
import { loadAdminPrefixCommands } from '../handlers/adminCommandLoader';
import { handleExp } from './expHandler';
import { handleAutomod } from '../events/automodHandler';

export async function handleMessage(message: Message) {
  if (message.author.bot || !message.guild) return;

  // 🚨 **Kiểm tra Automod trước khi xử lý XP & lệnh**
  const automodHandled = await handleAutomod(message);
  if (automodHandled) return; // Nếu Automod xử lý tin nhắn, dừng lại

  // 🌟 **Xử lý XP cho người dùng**
  await handleExp(message);

  // ⚡ **Xử lý lệnh Prefix**
  const prefix = getPrefix();
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const prefixCommands = await loadPrefixCommands();
  const adminPrefixCommands = await loadAdminPrefixCommands();
  const command = prefixCommands.get(commandName) || adminPrefixCommands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`❌ Lỗi khi thực thi lệnh ${commandName}:`, error);
    if (message.channel.isTextBased()) {
      const channel = message.channel as TextChannel | DMChannel | ThreadChannel;
      await channel.send('⚠ Đã xảy ra lỗi khi thực thi lệnh!');
    }
  }
}

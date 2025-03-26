// src/bot.ts

import {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
  MessageReaction,
  User,
  GuildMember
} from 'discord.js';
import dotenv from 'dotenv';
import { setRandomActivity } from './utils/activityUtils';
import { loadPrefixCommands, loadSlashCommands } from './handlers/commandLoader';
import { loadAdminPrefixCommands, loadAdminSlashCommands } from './handlers/adminCommandLoader';
import { onGuildMemberAdd } from './events/guildMemberAdd';
import { onGuildMemberRemove } from './events/guildMemberRemove';
import { handleMessage } from './events/messageCreate';
import { handleInteraction } from './events/interactionCreate';
import { initDatabase } from './database/database';
import { registerGiveawayReactions, registerGiveawayAutoEnd } from './events/giveawayReaction';
import Table from 'cli-table3';
import { setBackupInterval } from './automod/backupManager';
import { handleAntiRaidJoin } from './automod/antiRaid';
import { getGuildAutoBackup } from './database/guildSettings';
import { autoRefreshReactionRoleEmbeds } from './handlers/reactionRoleAutoRefresh';


// IMPORT các event Anti-Nuke và Panic Mode
import {
  onChannelCreate as antiNukeChannelCreate,
  onChannelDelete as antiNukeChannelDelete,
  onRoleCreate as antiNukeRoleCreate,
  onRoleDelete as antiNukeRoleDelete,
  onGuildBanAdd as antiNukeBanAdd
} from './events/antiNukeEvents';

import {
  onChannelCreate as panicChannelCreate,
  onChannelDelete as panicChannelDelete,
  onRoleCreate as panicRoleCreate,
  onRoleDelete as panicRoleDelete,
  onGuildBanAdd as panicBanAdd
} from './events/panicModeEvents';

// IMPORT Reaction Role events
import { onMessageReactionAdd, onMessageReactionRemove } from './events/reactionRoleEvents';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildIntegrations
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User, Partials.Channel]
});

export const slashCommandsCollection = new Collection<string, any>();
export const adminSlashCommandsCollection = new Collection<string, any>();

client.once('ready', async () => {
  console.log(`✅ Bot đã đăng nhập thành công với tên: ${client.user!.tag}`);

  // 🔄 Fetch owner để đảm bảo kiểm tra quyền chính xác
  await client.application?.fetch();

  try {
    const db = await initDatabase();
    console.log("✅ Database đã được khởi tạo thành công.");
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo database:", error);
  }

  setRandomActivity(client);
  setInterval(() => setRandomActivity(client), 1800000);
  setInterval(() => {
    autoRefreshReactionRoleEmbeds().catch(console.error);
  }, 10 * 60 * 1000); // Mỗi 10 phút

  const prefixCommands = await loadPrefixCommands();
  const slashCommands = await loadSlashCommands();
  const adminPrefixCommands = await loadAdminPrefixCommands();
  const adminSlashCommands = await loadAdminSlashCommands();

  slashCommands.forEach((cmd, name) => slashCommandsCollection.set(name, cmd));
  adminSlashCommands.forEach((cmd, name) => adminSlashCommandsCollection.set(name, cmd));

  console.log("\n📜 DANH SÁCH LẬNH CỦA BOT 📜\n");

  function displayCommandTable(title: string, commands: any[]) {
    console.log(`\n📌 ${title}`);
    if (commands.length > 0) {
      const table = new Table({
        head: ['Name', 'Description', 'File'],
        colWidths: [20, 50, 30],
        wordWrap: true,
        style: { head: ['cyan'], border: ['grey'] }
      });
      commands.forEach(cmd => {
        table.push([cmd.Name, cmd.Description, cmd.File]);
      });
      console.log(table.toString());
    } else {
      console.log("(Không có lệnh nào)");
    }
  }

  const userPrefixCommands = Array.from(prefixCommands.values()).map(cmd => ({
    Name: cmd?.name || 'N/A',
    Description: cmd?.description || 'Không có mô tả',
    File: cmd?.fileName || 'Không có file',
  }));

  const userSlashCommands = Array.from(slashCommands.values()).map(cmd => ({
    Name: cmd?.data?.name || 'N/A',
    Description: cmd?.data?.description || '❌ Không có mô tả',
    File: cmd?.fileName || 'Không có file',
  }));

  const adminPrefixCmds = Array.from(adminPrefixCommands.values()).map(cmd => ({
    Name: cmd?.name || 'N/A',
    Description: cmd?.description || 'Không có mô tả',
    File: cmd?.fileName || 'Không có file',
  }));

  const adminSlashCmds = Array.from(adminSlashCommands.values()).map(cmd => ({
    Name: cmd?.data?.name || 'N/A',
    Description: cmd?.data?.description || '❌ Không có mô tả',
    File: cmd?.fileName || 'Không có file',
  }));

  console.log("\n💡 === LẬNH NGƯỞI DÙNG === 💡");
  displayCommandTable("📌 PREFIX COMMANDS", userPrefixCommands);
  displayCommandTable("📌 SLASH COMMANDS", userSlashCommands);

  console.log("\n🔧 === LẬNH ADMIN === 🔧");
  displayCommandTable("📌 ADMIN PREFIX COMMANDS", adminPrefixCmds);
  displayCommandTable("📌 ADMIN SLASH COMMANDS", adminSlashCmds);

  // ✅ Tự động backup định kỳ cho toàn bộ guild khi bot khởi động
  for (const guild of client.guilds.cache.values()) {
    // Ví dụ: nếu cài đặt autoBackup = 1, gọi setBackupInterval
    // const autoBackup = await getGuildAutoBackup(guild.id);
    // if (autoBackup === 1) {
    //   setBackupInterval(guild, 30, 100);
    // }
  }
});

client.on('guildCreate', guild => {
  setBackupInterval(guild, 30, 50);
});

client.on('guildMemberAdd', async (member) => {
  await onGuildMemberAdd(member); // sự kiện cũ
  await handleAntiRaidJoin(member); // sự kiện chống RAID mới
});
client.on('guildMemberRemove', async (member) => {
  if (member.partial) {
    try {
      member = await member.fetch();
    } catch (error) {
      console.error("❌ Không thể lấy dữ liệu member:", error);
      return;
    }
  }
  await onGuildMemberRemove(member as GuildMember);
});

client.on('messageCreate', handleMessage);
client.on('interactionCreate', handleInteraction);

// Đăng ký các sự kiện Giveaway
registerGiveawayReactions(client);
registerGiveawayAutoEnd(client);

// Đăng ký các sự kiện Anti-Nuke và Panic Mode
client.on('channelCreate', async (channel) => {
  await antiNukeChannelCreate(channel);
  await panicChannelCreate(channel);
});
client.on('channelDelete', async (channel) => {
  await antiNukeChannelDelete(channel);
  await panicChannelDelete(channel);
});
client.on('roleCreate', async (role) => {
  await antiNukeRoleCreate(role);
  await panicRoleCreate(role);
});
client.on('roleDelete', async (role) => {
  await antiNukeRoleDelete(role);
  await panicRoleDelete(role);
});
client.on('guildBanAdd', async (ban) => {
  await antiNukeBanAdd(ban);
  await panicBanAdd(ban);
});


client.on('messageReactionAdd', async (reaction, user) => {
  // Xử lý reaction partial
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error('Không thể fetch reaction:', err);
      return;
    }
  }
  // Xử lý user partial
  if (user.partial) {
    try {
      await user.fetch();
    } catch (err) {
      console.error('Không thể fetch user:', err);
      return;
    }
  }

  // Giờ reaction đã là full MessageReaction, user đã là full User
  // Ép kiểu
  await onMessageReactionAdd(
    reaction as MessageReaction,
    user as User
  );
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error('Không thể fetch reaction:', err);
      return;
    }
  }
  if (user.partial) {
    try {
      await user.fetch();
    } catch (err) {
      console.error('Không thể fetch user:', err);
      return;
    }
  }

  await onMessageReactionRemove(
    reaction as MessageReaction,
    user as User
  );
});


client.login(process.env.DISCORD_TOKEN);

export { client };

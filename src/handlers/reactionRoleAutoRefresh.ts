// src/handlers/reactionRoleAutoRefresh.ts

import { client } from '../bot';
import { initDatabase } from '../database/database';
import { TextChannel, ChannelType, EmbedBuilder } from 'discord.js';
import { deleteReactionRoleMessage } from './reactionRoleLoader';

export async function autoRefreshReactionRoleEmbeds() {
  const db = await initDatabase();
  // Lấy tất cả embed Reaction Role từ DB
  const records = await db.all(`SELECT * FROM reaction_role_messages`);
  
  for (const record of records) {
    const { message_id, guild_id, channel_id } = record;
    try {
      const guild = client.guilds.cache.get(guild_id);
      if (!guild) continue;
      const channel = guild.channels.cache.get(channel_id);
      if (!channel || channel.type !== ChannelType.GuildText) continue;
      const textChannel = channel as TextChannel;
      
      // Thử fetch message
      const msg = await textChannel.messages.fetch(message_id).catch(() => null);
      
      if (!msg) {
        // Nếu không tìm thấy, xoá record DB
        await deleteReactionRoleMessage(message_id);
        // Gửi log DM tới admin (ADMIN_USER_ID, thay thế bằng ID admin thực tế)
        try {
          const adminUser = await client.users.fetch('ADMIN_USER_ID');
          const logEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('Embed Reaction Role Bị Xoá')
            .setDescription(
              `Embed Reaction Role có ID \`${message_id}\` trong kênh <#${channel_id}> đã bị xoá.\n` +
              `Lưu ý: Có thể đã bị xoá bởi ai đó hoặc do lỗi hệ thống.`
            )
            .setTimestamp();
          await adminUser.send({ embeds: [logEmbed] });
        } catch (err) {
          console.error('Không thể gửi DM log cho admin:', err);
        }
      } else {
        // Nếu message vẫn tồn tại, bạn có thể cập nhật nội dung embed nếu cần
        // Ví dụ, cập nhật timestamp, hoặc nội dung (nếu có thay đổi)
        // Hiện tại, ta không làm gì.
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý embed Reaction Role với ID ${message_id}:`, error);
    }
  }
}

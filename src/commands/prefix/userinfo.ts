import {
  Message,
  TextChannel,
  DMChannel,
  ThreadChannel,
  EmbedBuilder
} from 'discord.js';
import { getUserData } from '../../database/userDatabase'; // Lấy dữ liệu user (trừ level)
import { getUserLevel } from '../../levels/levelManager'; // Import hàm quản lý level

export const userinfoPrefixCommand = {
  name: 'userinfo',
  description: 'Xem thông tin cá nhân của bạn hoặc người khác (prefix)',
  async execute(message: Message, args: string) {
      if (!message.guild) return;

      // Lấy user ID từ mention hoặc chính người gọi lệnh
      const rawInput = args[0];
      const match = rawInput ? rawInput.match(/^<@!?(\d+)>$/) : null;
      const userId = match ? match[1] : rawInput || message.author.id;

      // Fetch user
      const user = await message.client.users.fetch(userId).catch(() => null);
      if (!user) {
          return message.reply('❌ Không tìm thấy người dùng này!');
      }

      const member = message.guild.members.cache.get(user.id);
      // Lấy dữ liệu user (chỉ lấy money, bank, messages)
      const economyAndMessagesData = await getUserData(message.guild.id, user.id);
      // Lấy thông tin level riêng
      const levelData = await getUserLevel(message.guild.id, user.id);

      // Lấy vai trò và xếp theo quyền lợi
    // Lấy vai trò và xếp theo quyền lợi
    const roles = member?.roles.cache
      .filter(role => role.id !== message.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString()) || [];

      // Embed thông tin cá nhân
      const embed = new EmbedBuilder()
          .setColor('#DEA2DD')
          .setTitle('✏️ | Thông tin người dùng')
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .setFields(
              {
                  name: '🆔 | **Thông tin chung**',
                  value: `> **ID:** ${user.id}\n> **Tên người dùng:** ${user.username}\n> **Trạng thái:** ${member?.presence?.status || 'Ngoại tuyến'}`,
                  inline: false
              },
              {
                  name: '⏳ | **Ngày tạo & Tham gia**',
                  value: `> **Tạo tài khoản:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n> **Tham gia server:** <t:${Math.floor(member?.joinedTimestamp! / 1000)}:F>`,
                  inline: false
              },
              {
                  name: `🍥 | **Vai trò (${roles.length})**`,
                  value: roles.length > 0 ? roles.join(', ') : '`Không có vai trò`',
                  inline: false
              },
              {
                  name: '🏦 | **Tiền tệ & Cấp độ**',
                  value: `> **Tiền:** ${economyAndMessagesData.money.toLocaleString('vi-VN')} VNĐ\n> **Ngân hàng:** ${economyAndMessagesData.bank.toLocaleString('vi-VN')} VNĐ\n> **Cấp độ:** ${levelData.level}\n> **Tin nhắn:** ${economyAndMessagesData.messages}`,
                  inline: false
              }
          )
          .setFooter({ text: 'MineKeo Network' })
          .setTimestamp();

      // Gửi Embed
      if (message.channel.isTextBased()) {
          const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
          await ch.send({ embeds: [embed] });
      }
  },
};
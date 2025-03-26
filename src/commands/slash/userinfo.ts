import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { getUserData } from '../../database/userDatabase'; // Lấy dữ liệu user (trừ level)
import { getUserLevel } from '../../levels/levelManager'; // Import hàm quản lý level

export const userinfoSlashCommand = {
  data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Xem thông tin cá nhân của bạn hoặc người khác (slash)')
      .addUserOption(option =>
          option.setName('target')
              .setDescription('Người dùng cần xem thông tin')
              .setRequired(false)
      ),
  async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser('target') || interaction.user;
      const member = interaction.guild?.members.cache.get(targetUser.id);

      // Lấy dữ liệu user (chỉ lấy money, bank, messages)
      const economyAndMessagesData = await getUserData(interaction.guild!.id, targetUser.id);
      // Lấy thông tin level riêng
      const levelData = await getUserLevel(interaction.guild!.id, targetUser.id);

      if (!targetUser) {
          return interaction.reply({ content: '❌ Không tìm thấy người dùng!', ephemeral: true });
      }

      // Lấy danh sách vai trò và xếp theo quyền lợi
      // Lấy danh sách vai trò và xếp theo quyền lợi
      const roles = member?.roles.cache
  .filter(role => role.id !== interaction.guild?.id)
  .sort((a, b) => b.position - a.position)
  .map(role => role.toString()) || [];

      // Embed
      const embed = new EmbedBuilder()
          .setColor('#DEA2DD')
          .setTitle('✏️ | Thông tin người dùng')
          .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
          .setFields(
              {
                  name: '🆔 | **Thông tin chung**',
                  value: `> **ID:** ${targetUser.id}\n> **Tên người dùng:** ${targetUser.username}\n> **Trạng thái:** ${member?.presence?.status || 'Ngoại tuyến'}`,
                  inline: false
              },
              {
                  name: '⏳ | **Ngày tạo & Tham gia**',
                  value: `> **Tạo tài khoản:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>\n> **Tham gia server:** <t:${Math.floor(member?.joinedTimestamp! / 1000)}:F>`,
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

      await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
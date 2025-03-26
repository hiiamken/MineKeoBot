// src/admincommands/slash/reactionRoleCommand.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  Message,
  TextChannel,
  ChannelType
} from 'discord.js';
import { saveReactionRoleMessage, saveReactionRoleMapping } from '../../handlers/reactionRoleLoader';
import { parseRolesData } from '../../utils/parseRolesData';

export const reactionRoleCommand = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Tạo embed đăng ký nhận role qua reaction (không dùng modal).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    // 1) Kiểm tra guild
    if (!interaction.guild) {
      return interaction.reply({ content: 'Lệnh này chỉ dùng trong server!', ephemeral: true });
    }

    // 2) Lấy channel hiện tại, ép kiểu TextChannel để sử dụng các phương thức send và createMessageCollector
    const mainChannel = interaction.channel;
    if (!mainChannel || !mainChannel.isTextBased()) {
      return interaction.reply({
        content: 'Channel hiện tại không phải kênh text!',
        ephemeral: true
      });
    }
    const textChannel = mainChannel as TextChannel;

    // 3) Gửi tin ephemeral hướng dẫn bắt đầu thiết lập Reaction Role
    await interaction.reply({
      content:
        'Bắt đầu thiết lập Reaction Role (5 bước):\n' +
        '0) Nhập **ID kênh** hoặc **mention kênh** để gửi embed (VD: 1234567890123 hoặc #general)\n' +
        '1) Nhập **tiêu đề** cho embed\n' +
        '2) Nhập **opening_text** (hoặc "none" để bỏ)\n' +
        '3) Nhập **Danh sách role** (mỗi dòng: `roleId|icon|mô tả`, có thể nhập tag role như `<@&roleId>`)\n' +
        '4) Nhập **closing_text** (hoặc "none" để bỏ)\n\n' +
        'Mỗi bước có **5 phút** để trả lời.',
      ephemeral: true
    });

    const userId = interaction.user.id;

    // 4) Tạo collector để lắng nghe tin nhắn của người dùng trong channel hiện tại (tổng thời gian 25 phút)
    const collector = textChannel.createMessageCollector({
      filter: (m: Message) => m.author.id === userId,
      time: 25 * 60_000
    });

    let step = 0;
    let embedChannelId = '';
    let embedTitle = '';
    let openingText = '';
    let rolesData = '';
    let closingText = '';

    // Bước 0: Hỏi kênh để gửi embed
    await textChannel.send(`<@${userId}> **Bước 0**: Nhập **ID kênh** hoặc **mention kênh** (VD: 1234567890123 hoặc #general).`);

    collector.on('collect', async (msg: Message) => {
      if (msg.author.id !== userId) return;
      const content = msg.content.trim();

      if (step === 0) {
        // Lấy kênh: nếu user nhập mention dạng <#1234567890123>, loại bỏ các ký tự đặc biệt
        embedChannelId = content.replace(/[<#>]/g, '');
        step++;
        await textChannel.send(`<@${userId}> **Bước 1**: Nhập **tiêu đề** cho embed.`);
        return;
      }

      if (step === 1) {
        // Lấy tiêu đề embed
        embedTitle = content;
        step++;
        await textChannel.send(`<@${userId}> **Bước 2**: Nhập **opening_text** (hoặc gõ "none" để bỏ).`);
        return;
      }

      if (step === 2) {
        // Lấy opening_text
        openingText = (content.toLowerCase() === 'none') ? '' : content;
        step++;
        await textChannel.send(
          `<@${userId}> **Bước 3**: Nhập danh sách role (mỗi dòng "roleId|icon|mô tả").\nVí dụ:\n112233|🍌|Role Banana\n<@&445566>|<:Kitkat:1234>|Role Kitkat`
        );
        return;
      }

      if (step === 3) {
        // Lấy danh sách role
        rolesData = (content.toLowerCase() === 'none') ? '' : content;
        step++;
        await textChannel.send(`<@${userId}> **Bước 4**: Nhập **closing_text** (hoặc gõ "none" để bỏ).`);
        return;
      }

      if (step === 4) {
        // Lấy closing_text
        closingText = (content.toLowerCase() === 'none') ? '' : content;
        step++;
        collector.stop('done');
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason !== 'done') {
        return textChannel.send(`<@${userId}> Hết thời gian hoặc chưa trả lời đủ các bước!`);
      }

      // 5) Tìm kênh để gửi embed dựa trên embedChannelId
      const guild = interaction.guild!;
const embedChannel = guild.channels.cache.get(embedChannelId);

// Bước 1: Kiểm tra embedChannel có tồn tại
if (!embedChannel) {
  return textChannel.send(
    `<@${userId}> Kênh \`${embedChannelId}\` không tồn tại!`
  );
}

// Bước 2: Kiểm tra type kênh
if (
  embedChannel.type !== ChannelType.GuildText &&
  embedChannel.type !== ChannelType.GuildAnnouncement
) {
  return textChannel.send(
    `<@${userId}> Kênh \`${embedChannelId}\` không phải kênh text hoặc kênh thông báo!`
  );
}

// Bước 3: Ép kiểu sang TextChannel (nếu bạn chỉ muốn TextChannel), 
// hoặc chấp nhận GUILD_ANNOUNCEMENT => ép kiểu sang TextChannel
const targetChannel = embedChannel as TextChannel;

      // 6) Parse danh sách role (sử dụng hàm parseRolesData từ utils)
      const rolesInfo = parseRolesData(rolesData);

      // 7) Tạo nội dung cho phần role
      let roleContent = '';
      for (const r of rolesInfo) {
        // Format: «icon» <@&roleId> mô tả
        roleContent += `«${r.icon}» <@&${r.roleId}> ${r.desc}\n\n`;
      }
      const fullDesc = `${openingText}\n\n${roleContent}\n${closingText}`.trim();

      // 8) Tạo embed với màu hồng nhẹ #DEA2DD
      const embed = new EmbedBuilder()
        .setTitle(embedTitle || 'Đăng ký nhận role')
        .setDescription(fullDesc)
        .setColor('#DEA2DD')
        .setFooter({
          text: 'MINEKEO NETWORK',
          iconURL: guild.iconURL() ?? undefined
        })
        .setTimestamp();

      // 9) Gửi embed vào kênh target
      const msg = await targetChannel.send({ embeds: [embed] });

      // 10) Lưu config vào database thông qua các hàm lưu của reactionRoleLoader
      await saveReactionRoleMessage(
        msg.id,
        guild.id,
        targetChannel.id,
        'normal', // Bạn có thể bổ sung thêm tùy chọn loại nếu muốn
        openingText,
        closingText
      );

      // 11) Thêm reaction cho mỗi role và lưu mapping
      for (const r of rolesInfo) {
        await saveReactionRoleMapping(msg.id, r.icon, r.roleId);
        try {
          await msg.react(r.icon);
        } catch (err) {
          console.error(`Lỗi react icon ${r.icon}:`, err);
        }
      }

      // 12) Thông báo hoàn tất trong kênh lệnh
      await textChannel.send(
        `<@${userId}> **Đã tạo Reaction Role thành công** tại kênh <#${embedChannelId}>!`
      );
    });
  },
};

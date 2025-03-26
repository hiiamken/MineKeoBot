// src/events/reactionRoleEvents.ts

import {
  MessageReaction,
  User,
  EmbedBuilder,
} from 'discord.js';
import { getReactionRoleMessage, getReactionRoleMappings } from '../handlers/reactionRoleLoader';

export async function onMessageReactionAdd(reaction: MessageReaction, user: User) {
  if (user.bot) return;

  // Xử lý partial cho reaction và user
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

  const messageId = reaction.message.id;
  // Lấy cấu hình Reaction Role từ DB
  const rrConfig = await getReactionRoleMessage(messageId);
  if (!rrConfig) return;

  const rolesMap = await getReactionRoleMappings(messageId);
  const emojiKey = reaction.emoji.toString();
  const roleId = rolesMap.get(emojiKey);
  if (!roleId) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  // Nếu kiểu "normal": thêm role đơn giản
  if (rrConfig.type === 'normal') {
    await member.roles.add(roleId).catch(() => null);

    // Gửi DM thông báo nhận role thành công
    const successEmbed = new EmbedBuilder()
      .setColor('#DEA2DD')
      .setTitle('Nhận role thành công')
      .setDescription(`Bạn đã nhận role <@&${roleId}> thành công!`)
      .setFooter({ text: 'MineKeo Network' })
      .setTimestamp();

    try {
      await user.send({ embeds: [successEmbed] });
    } catch (err) {
      console.error('Không thể gửi DM cho user:', err);
    }
  } 
  // Nếu kiểu "unique": cho phép chỉ nhận 1 role duy nhất
  else if (rrConfig.type === 'unique') {
    let previousRoleId: string | null = null;

    // Duyệt qua các role của embed này để xem nếu user đã có role nào
    for (const [emo, rId] of rolesMap.entries()) {
      if (member.roles.cache.has(rId)) {
        // Nếu role hiện tại khác với role mới, lưu lại role cũ để thông báo
        if (rId !== roleId) {
          previousRoleId = rId;
          await member.roles.remove(rId).catch(() => null);
          const oldReact = reaction.message.reactions.resolve(emo);
          if (oldReact) {
            await oldReact.users.remove(user.id).catch(() => null);
          }
        }
      }
    }
    // Thêm role mới
    await member.roles.add(roleId).catch(() => null);

    // Tạo embed DM thông báo chuyển đổi hoặc nhận role mới
    const uniqueEmbed = new EmbedBuilder()
      .setColor('#DEA2DD')
      .setFooter({ text: 'MineKeo Network' })
      .setTimestamp();

    if (previousRoleId && previousRoleId !== roleId) {
      uniqueEmbed
        .setTitle('Chuyển đổi Role Thành Công')
        .setDescription(`Bạn đã chuyển từ <@&${previousRoleId}> sang <@&${roleId}> thành công!`);
    } else {
      uniqueEmbed
        .setTitle('Nhận Role Thành Công')
        .setDescription(`Bạn đã nhận role <@&${roleId}> thành công!`);
    }

    try {
      await user.send({ embeds: [uniqueEmbed] });
    } catch (err) {
      console.error('Không thể gửi DM cho user:', err);
    }
  }
}

export async function onMessageReactionRemove(reaction: MessageReaction, user: User) {
  if (user.bot) return;

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

  const messageId = reaction.message.id;
  const rrConfig = await getReactionRoleMessage(messageId);
  if (!rrConfig) return;

  const rolesMap = await getReactionRoleMappings(messageId);
  const emojiKey = reaction.emoji.toString();
  const roleId = rolesMap.get(emojiKey);
  if (!roleId) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await member.roles.remove(roleId).catch(() => null);

  // Gửi DM thông báo bỏ role
  const removeEmbed = new EmbedBuilder()
    .setColor('#DEA2DD')
    .setTitle('Bỏ role thành công')
    .setDescription(`Bạn đã bỏ role <@&${roleId}> thành công!`)
    .setFooter({ text: 'MineKeo Network' })
    .setTimestamp();

  try {
    await user.send({ embeds: [removeEmbed] });
  } catch (err) {
    console.error('Không thể gửi DM:', err);
  }
}

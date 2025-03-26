import {
  Client,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  EmbedBuilder,
  TextChannel,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from 'discord.js';
import cron from 'node-cron';
import {
  getActiveGiveaway,
  getAllOngoingGiveaways,
  endGiveaway
} from '../database/giveaway';
import {
  addParticipant,
  removeParticipant,
  countParticipants,
  randomParticipants
} from '../database/giveawayParticipants';
import {
  getUserLevel,
  getUserMoney,
  getUserInvites
} from '../database/requirements';

export function registerGiveawayReactions(client: Client) {
  client.on('messageReactionAdd', async (reaction, user) => {
    await handleGiveawayReaction(client, reaction, user, true);
  });
  client.on('messageReactionRemove', async (reaction, user) => {
    await handleGiveawayReaction(client, reaction, user, false);
  });
}

export function registerGiveawayAutoEnd(client: Client) {
  cron.schedule('*/1 * * * *', async () => {
    await autoEndExpiredGiveaways(client);
  });
}

function generateWinnerEmbed(user: User, giveaway: any, winners: string[], totalParticipants: number) {
  const winRate = ((1 / totalParticipants) * 100).toFixed(2); // Tính tỉ lệ thắng %
  
  const embed = new EmbedBuilder()
    .setColor('#DEA2DD')
    .setTitle('🏆 Bạn đã chiến thắng Giveaway!')
    .setDescription(`
🎉 **Chúc mừng ${user.username}!**  
Bạn đã nằm trong danh sách **người chiến thắng** của giveaway:  
🎁 **${giveaway.prize}**

📜 **Danh sách người chiến thắng:**
${winners.map(id => `<@${id}>`).join(', ')}

📊 **Tỉ lệ chiến thắng:** ${winRate}% (${winners.length}/${totalParticipants} người tham gia)

🛍 **Hãy liên hệ với admin để nhận phần thưởng nhé!** 🎊
    `)
    .setFooter({ text: 'Chúc bạn may mắn trong các giveaway tiếp theo!' })
    .setTimestamp();

  // ✅ Kiểm tra URL hợp lệ trước khi setThumbnail
  if (giveaway.image && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/.test(giveaway.image)) {
    embed.setThumbnail(giveaway.image);
  }

  return { embeds: [embed] };
}


async function autoEndExpiredGiveaways(client: Client) {
  try {
    const now = Date.now();
    const giveaways = await getAllOngoingGiveaways();
    
    for (const g of giveaways) {
      if (g.end_time > now) continue;

      // 📌 Lưu danh sách participants vào database trước khi kết thúc
      await endGiveaway(g.guild_id, g.message_id);

      const channel = client.channels.cache.get(g.channel_id) as TextChannel;
      if (!channel) continue;

      let oldMessage;
      try { oldMessage = await channel.messages.fetch(g.message_id); } catch {}

      const total = await countParticipants(g.message_id);
      const winnerCount = g.winners_count || 1;

      const winners = total > 0 
        ? (await randomParticipants(g.message_id, winnerCount))
          .map((w: any) => w.user_id)
        : [];

      const winnerMentions = winners.length > 0
        ? winners.map(id => `<@${id}>`).join(', ')
        : 'Không có ai tham gia';

      if (winners.length > 0) {
        await channel.send(`🎉 Chúc mừng ${winnerMentions}! Bạn đã chiến thắng **${g.prize}**!`);

        // 📩 Gửi tin nhắn riêng cho từng người thắng
        for (const winnerId of winners) {
          try {
            const user = await client.users.fetch(winnerId);
            await user.send(generateWinnerEmbed(user, g, winners, total));
          } catch (err) {
            console.error(`❌ Lỗi khi gửi tin nhắn riêng cho ${winnerId}:`, err);
          }
        }
      }

      const endedEmbed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY ĐÃ KẾT THÚC! 🎉')
        .setColor('#DEA2DD')
        .setDescription(`
**Cảm ơn** <@${g.host_id}> đã tổ chức giveaway!

**Thông tin:**
• **Phần thưởng**: ${g.prize}
• **Số người thắng**: ${winnerCount}
• **Kết thúc**: <t:${Math.floor(g.end_time / 1000)}:R>

**Người trúng thưởng**: ${winnerMentions}`)
        .setFooter({ text: `ID: ${g.message_id}` })
        .setTimestamp();

      oldMessage ? await oldMessage.edit({ embeds: [endedEmbed], content: '' }) : await channel.send({ embeds: [endedEmbed] });
    }
  } catch (error) { console.error('Lỗi autoEndExpiredGiveaways:', error); }
}


async function handleGiveawayReaction(
  client: Client,
  reactionParam: MessageReaction | PartialMessageReaction,
  userParam: User | PartialUser,
  added: boolean
) {
  try {
    if (reactionParam.partial) await reactionParam.fetch();
    if (userParam.partial) await userParam.fetch();

    const reaction = reactionParam as MessageReaction;
    const user = userParam as User;

    if (user.bot || !reaction.message.guild || reaction.emoji.name !== '🎉') return;

    const giveaway = await getActiveGiveaway(reaction.message.guild.id, reaction.message.id);
    if (!giveaway) return;

    const guild = await client.guilds.fetch(reaction.message.guild.id);
    const thumbnail = guild.iconURL() || '';

    if (!added) {
      // ❌ Người dùng rời khỏi giveaway
      
      await removeParticipant(giveaway.message_id, user.id);
      await updateGiveawayEmbed(client, reaction.message.guild.id, giveaway);
      
      // ✅ Gửi tin nhắn rời khỏi giveaway
      await user.send(generateLeaveEmbed(user, giveaway, thumbnail));
      return;
    }

    // 🛑 Kiểm tra điều kiện trước khi cho tham gia
    if (giveaway.require_role) {
      const member = await reaction.message.guild.members.fetch(user.id);
      if (!member.roles.cache.has(giveaway.require_role)) {
        await reaction.users.remove(user.id);
        return;
      }
    }
    if (giveaway.require_level && await getUserLevel(reaction.message.guild.id, user.id) < giveaway.require_level) {
      await reaction.users.remove(user.id);
      return;
    }
    if (giveaway.require_money && await getUserMoney(reaction.message.guild.id, user.id) < giveaway.require_money) {
      await reaction.users.remove(user.id);
      return;
    }
    if (giveaway.require_invite && await getUserInvites(reaction.message.guild.id, user.id) < giveaway.require_invite) {
      await reaction.users.remove(user.id);
      return;
    }
    
    await addParticipant(giveaway.message_id, user.id);
    await updateGiveawayEmbed(client, reaction.message.guild.id, giveaway);

    // ✅ Gửi tin nhắn tham gia thành công
    await user.send(generateJoinEmbed(user, giveaway, thumbnail));

  } catch (error) {
    console.error('Lỗi handleGiveawayReaction:', error);
  }
}

function generateJoinEmbed(user: User, giveaway: any, thumbnail?: string) {
  // Tạo Embed
  const embed = new EmbedBuilder()
    .setColor('#DEA2DD')
    .setTitle('🎉 Tham gia Giveaway thành công!')
    .setThumbnail(thumbnail || '')
    .setDescription(`Chúc mừng ${user}! Bạn đã tham gia giveaway:\n🎁 **${giveaway.prize}**`)
    .setFooter({ text: `Kết thúc: ${new Date(giveaway.end_time).toLocaleString()}` })
    .setTimestamp()
    .addFields({ name: '📅 Kết thúc', value: `<t:${Math.floor(giveaway.end_time / 1000)}:R>`, inline: true });

  // Tạo nút "Xem Giveaway"
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('🔗 Xem Giveaway')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${giveaway.guild_id}/${giveaway.channel_id}/${giveaway.message_id}`)
  );

  // Trả về Embed + Button
  return { embeds: [embed], components: [buttonRow] };
}

function generateLeaveEmbed(user: User, giveaway: any, thumbnail?: string) {
  const embed = new EmbedBuilder()
    .setColor('#DEA2DD')
    .setTitle('❌ Bạn đã rời khỏi Giveaway')
    .setThumbnail(thumbnail || '')
    .setDescription(`Hẹn gặp lại ${user}! Bạn đã rời khỏi giveaway **${giveaway.prize}**.
Nếu muốn tham gia lại, hãy react 🎉 nhé!`)
    .setFooter({ text: `Kết thúc: ${new Date(giveaway.end_time).toLocaleString()}` })
    .setTimestamp();

  // Tạo nút "Xem Giveaway"
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('🔗 Xem Giveaway')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${giveaway.guild_id}/${giveaway.channel_id}/${giveaway.message_id}`)
  );

  // Trả về Embed + Button trong một object
  return { embeds: [embed], components: [buttonRow] };
}

export async function updateGiveawayEmbed(client: Client, guildId: string, giveaway: any) {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return;
    const channel = guild.channels.cache.get(giveaway.channel_id) as TextChannel;
    if (!channel) return;
    let oldMessage;
    try { oldMessage = await channel.messages.fetch(giveaway.message_id); } catch { return; }
    const total = await countParticipants(giveaway.message_id);

    const updatedEmbed = EmbedBuilder.from(oldMessage.embeds[0])
      .setDescription(`**Cảm ơn** <@${giveaway.host_id}> đã tổ chức giveaway!\n\n`
        + `**Phần thưởng:** ${giveaway.prize}\n`
        + `**Số người thắng:** ${giveaway.winners_count}\n`
        + `**Kết thúc:** <t:${Math.floor(giveaway.end_time / 1000)}:R>\n`
        + `**Số người tham gia:** ${total}`);

    await oldMessage.edit({ embeds: [updatedEmbed] });
  } catch (err) { console.error('Lỗi updateGiveawayEmbed:', err); }
}

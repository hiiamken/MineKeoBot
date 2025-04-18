import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import {
  getActiveGiveaway,
  endGiveaway,
  updateGiveawayParticipants
} from '../../../database/giveaway';
import { getGiveawayParticipants } from '../../../database/giveawayParticipants';

export const endGiveawayCommand = {
  data: new SlashCommandBuilder()
    .setName('endgiveaway')
    .setDescription('Kết thúc một giveaway đang diễn ra.')
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('ID của Giveaway cần kết thúc')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Lệnh này chỉ có thể được sử dụng trong server!',
        ephemeral: true
      });
    }

    const guildId = interaction.guild.id;
    const messageId = interaction.options.getString('message_id', true);

    // Lấy thông tin giveaway
    const giveaway = await getActiveGiveaway(guildId, messageId);
    if (!giveaway) {
      return interaction.reply({
        content: '🚫 Không tìm thấy giveaway với ID này hoặc đã kết thúc!',
        ephemeral: true
      });
    }

    // Lấy danh sách participants
    let participants: string[] = [];
    try {
      participants = giveaway.participants ? JSON.parse(giveaway.participants) : [];
    } catch (err) {
      console.error("Lỗi parse participants:", err);
    }

    if (participants.length === 0) {
      const dbParticipants = await getGiveawayParticipants(messageId);
      participants = dbParticipants.map(p => p.user_id);
    }

    await updateGiveawayParticipants(guildId, messageId, participants);
    await endGiveaway(guildId, messageId);

    // Xử lý chọn người thắng
    const total = participants.length;
    const wc = giveaway.winners_count || 1;
    let winnerMentions = 'Không có ai tham gia';
    let winners: string[] = [];

    if (total > 0) {
      const shuffled = participants.sort(() => 0.5 - Math.random());
      winners = total <= wc ? participants : shuffled.slice(0, wc);
      winnerMentions = winners.map(u => `<@${u}>`).join(', ');
    }

    // Gửi tin nhắn trong kênh
    const channel = interaction.guild.channels.cache.get(giveaway.channel_id) as TextChannel;
    if (channel) {
      await channel.send(`🎉 Chúc mừng ${winnerMentions}! Bạn đã chiến thắng **${giveaway.prize}**!`);
    }

    // Gửi tin nhắn riêng cho người chiến thắng
    for (const winnerId of winners) {
      try {
        const user = await interaction.client.users.fetch(winnerId);
        const winRate = ((1 / total) * 100).toFixed(2);
        
        const embed = new EmbedBuilder()
          .setColor('#DEA2DD')
          .setTitle('🏆 Bạn đã chiến thắng Giveaway!')
          .setDescription(`
🎉 **Chúc mừng ${user.username}!**
Bạn đã nằm trong danh sách **người chiến thắng** của giveaway:  
🎁 **${giveaway.prize}**

📜 **Danh sách người chiến thắng:**
${winnerMentions}

📊 **Tỉ lệ chiến thắng:** ${winRate}% (${winners.length}/${total} người tham gia)

🛍 **Hãy liên hệ với admin để nhận phần thưởng nhé!** 🎊
          `)
          .setFooter({ text: 'Chúc bạn may mắn trong các giveaway tiếp theo!' })
          .setTimestamp();

        if (giveaway.image && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/.test(giveaway.image)) {
          embed.setThumbnail(giveaway.image);
        }

        await user.send({ embeds: [embed] });
      } catch (err) {
        console.error(`❌ Lỗi khi gửi tin nhắn riêng cho ${winnerId}:`, err);
      }
    }

    // Cập nhật Embed
    let desc = `**Cảm ơn** <@${giveaway.host_id}> đã tổ chức giveaway!\n\n`;
    desc += `**Thông tin:**\n`;
    desc += `• **Phần thưởng**: ${giveaway.prize}\n`;
    desc += `• **Số người thắng**: ${giveaway.winners_count}\n`;
    desc += `• **Kết thúc**: <t:${Math.floor(Date.now() / 1000)}:R>\n\n`;
    desc += `**Người trúng thưởng:** ${winnerMentions}`;

    const endedEmbed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY ĐÃ KẾT THÚC! 🎉')
      .setColor('#DEA2DD')
      .setDescription(desc)
      .setFooter({ text: `ID: ${giveaway.message_id}` })
      .setTimestamp();

    if (channel) {
      try {
        const oldMessage = await channel.messages.fetch(giveaway.message_id);
        await oldMessage.edit({ embeds: [endedEmbed], content: '' });
      } catch (err) {
        console.error("Lỗi cập nhật embed:", err);
      }
    }

    await interaction.reply({
      content: `✅ Giveaway **"${giveaway.prize}"** đã kết thúc!`,
      ephemeral: true
    });
  }
};
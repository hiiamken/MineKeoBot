import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
  User
} from 'discord.js';
import { getGiveawayByMessageId } from '../../../database/giveaway';  // ✅ Dùng `message_id`
import { getGiveawayParticipants } from '../../../database/giveawayParticipants';

export const rerollGiveawayCommand = {
  data: new SlashCommandBuilder()
    .setName('rerollgiveaway')
    .setDescription('🔄 Quay lại người chiến thắng cho một giveaway.')
    .addStringOption(option =>
      option
        .setName('message_id') // ✅ Dùng `message_id`
        .setDescription('ID của giveaway cần quay lại người thắng')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Lệnh này chỉ sử dụng trong server!',
        ephemeral: true
      });
    }

    const guildId = interaction.guild.id;
    const messageId = interaction.options.getString('message_id', true); // ✅ Dùng `messageId`


    // 🔍 1) Lấy thông tin giveaway
    const giveaway = await getGiveawayByMessageId(guildId, messageId);
    if (!giveaway) {
      return interaction.reply({
        content: '⚠ Không tìm thấy giveaway với ID này!',
        ephemeral: true
      });
    }

    // 🔍 2) Lấy danh sách người tham gia
    let participants: string[] = [];
    try {
      participants = giveaway.participants
        ? JSON.parse(giveaway.participants)
        : [];
    } catch {
      participants = [];
    }

    if (participants.length === 0) {
      
      // ✅ Lấy từ bảng `giveaway_participants`
      const dbParticipants = await getGiveawayParticipants(messageId);
      participants = dbParticipants.map(p => p.user_id);
    }


    // 🔍 3) Xử lý chọn người thắng
    const total = participants.length;
    const wc = giveaway.winners_count || 1;

    let winnerMentions = 'Không có ai tham gia';
    let winners: string[] = [];

    if (total > 0) {
      const shuffled = participants.sort(() => 0.5 - Math.random());
      winners = total <= wc ? participants : shuffled.slice(0, wc);
      winnerMentions = winners.map(u => `<@${u}>`).join(', ');
    }

    // 🔹 4) Tạo Embed mới cho reroll
    const rerollEmbed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY ĐÃ ĐƯỢC QUAY LẠI! 🎉')
      .setColor('#DEA2DD')
      .setDescription(`
**Thông tin:**
• **Phần thưởng**: ${giveaway.prize}
• **Số người thắng**: ${giveaway.winners_count}
• **Đã quay lại bởi**: <@${interaction.user.id}>
• **Người tổ chức**: <@${giveaway.host_id}>

**Người trúng thưởng (mới)**: ${winnerMentions}
`)
      .setFooter({ text: `ID: ${giveaway.message_id}` })
      .setTimestamp();

    // 🔄 5) Gửi thông báo reroll vào kênh giveaway
    const channel = interaction.guild.channels.cache.get(
      giveaway.channel_id
    ) as TextChannel;
    if (channel) {
      await channel.send({ embeds: [rerollEmbed] });
    }

    // 📩 6) Gửi tin nhắn riêng cho người trúng thưởng
    for (const winnerId of winners) {
      try {
        const user = await interaction.client.users.fetch(winnerId);
        await user.send(generateWinnerEmbed(user, giveaway, winners, total));
      } catch (err) {
        console.error(`❌ Lỗi khi gửi tin nhắn riêng cho ${winnerId}:`, err);
      }
    }

    // ✅ 7) Phản hồi ephemeral
    return interaction.reply({
      content: `✅ Đã quay lại người thắng cho giveaway **${messageId}**!`,
      ephemeral: true
    });
  }
};

/**
 * 🔥 Hàm tạo Embed cho người chiến thắng khi reroll
 */
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

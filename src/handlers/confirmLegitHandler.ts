import {
    ButtonInteraction,
    EmbedBuilder,
    InteractionReplyOptions,
  } from 'discord.js';
  import { confirmLegitLink } from '../database/warnSystem';
  
  export async function handleConfirmLegitButton(interaction: ButtonInteraction) {
    const { customId, user, message } = interaction;
  
    // Kiểm tra định dạng customId
    if (!customId.startsWith('confirm_legit_link_')) return;
  
    const userId = customId.split('confirm_legit_link_')[1];
    if (user.id !== userId) {
      return interaction.reply({
        content: '❌ Bạn không thể xác nhận liên kết của người khác.',
        ephemeral: true,
      });
    }
  
    // Lấy lại nội dung link từ embed gốc
    const embed = message.embeds?.[0];
    const linkContent =
      embed?.fields?.find((f) => f.name === '📎 Nội dung bạn đã gửi:')?.value;
  
    if (!linkContent) {
      return interaction.reply({
        content: '❌ Không thể xác định liên kết từ tin nhắn cũ.',
        ephemeral: true,
      });
    }
  
    // Xử lý loại bỏ ``` nếu có
    const cleanLink = linkContent.replace(/```/g, '').trim();
  
    // Ghi nhận vào database
    await confirmLegitLink(userId, cleanLink);
  
    // Xoá embed gốc (nếu bot có quyền)
    try {
      await message.delete();
    } catch (err) {
      console.warn('⚠️ Không thể xoá tin nhắn xác nhận legit:', err);
    }
  
    // Gửi phản hồi xác nhận
    const confirmedEmbed = new EmbedBuilder()
      .setColor('#DEA2DD')
      .setDescription(
        `✅ **Liên kết đã được xác nhận thành công!**\n` +
          `Bạn có thể gửi lại link này trong tương lai mà không bị cảnh báo.`
      );
  
    await interaction.reply({
      embeds: [confirmedEmbed],
      ephemeral: true,
    } satisfies InteractionReplyOptions);
  }
  
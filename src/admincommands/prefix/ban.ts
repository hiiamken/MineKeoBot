import { Message, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const banCommand = {
  name: 'ban',
  description: 'Cấm một người dùng khỏi server.',

  async execute(message: Message, args: string[]) {
    if (!message.member || !hasPermission(message.member)) {
      return message.reply('🚫 Bạn không có quyền sử dụng lệnh này!');
    }

    const userId = args[0]?.replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'Không có lý do cụ thể';
    const caseId = `MK-${Date.now().toString(36).toUpperCase()}`;

    if (!userId) {
      return message.reply('⚠ Vui lòng cung cấp ID hoặc mention người cần ban.');
    }

    try {
      const user = await message.guild?.members.fetch(userId).catch(() => null);
      if (!user) {
        return message.reply('⚠ Người dùng không tồn tại trong server.');
      }

      if (message.member.roles.highest.position <= user.roles.highest.position) {
        return message.reply('⚠ Bạn không thể ban người có quyền cao hơn hoặc bằng bạn!');
      }

      await user.ban({ reason });

      // Lưu log vào database
      await logInfraction(message.guild!.id, user.id, message.author.id, 'ban', reason);

      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('`🔨` Xử lý vi phạm - Ban')
        .setDescription(
          `\n\`📌\` **Thông tin vi phạm**\n> **Người dùng:** <@${user.id}>\n> **Người xử lý:** <@${message.author.id}>\n> **ID:** \`${caseId}\`\n\n\`⏰\` **Thông tin cấm**\n> **Lý do:** ${reason}\n> **Thời gian:** Vĩnh viễn\n`)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Xử lý bởi: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      await (message.channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi khi ban người dùng:', error);
      return message.reply('⚠ Đã xảy ra lỗi khi cấm người dùng.');
    }
  }
};

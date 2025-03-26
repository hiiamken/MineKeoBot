import { Message, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
import { hasPermission } from '../../config/config';
import { logInfraction } from '../../database/database';

export const kickCommand = {
  name: 'kick',
  description: 'Đuổi một người dùng khỏi server.',

  async execute(message: Message, args: string[]) {
    if (!message.member || !hasPermission(message.member)) {
      return message.reply('🚫 Bạn không có quyền sử dụng lệnh này!');
    }

    if (!message.guild) return;

    const userId = args[0]?.replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'Không có lý do cụ thể';
    const caseId = `MK-${Date.now().toString(36).toUpperCase()}`;

    if (!userId) {
      return message.reply('⚠ Vui lòng cung cấp ID hoặc mention người cần đuổi.');
    }

    const user = await message.guild.members.fetch(userId).catch(() => null);
    if (!user) {
      return message.reply('⚠ Người dùng không tồn tại trong server.');
    }

    if (message.member.roles.highest.position <= user.roles.highest.position) {
      return message.reply('⚠ Bạn không thể kick người có quyền cao hơn hoặc ngang bằng bạn!');
    }

    try {
      await user.kick(reason);
      await logInfraction(message.guild.id, user.id, message.author.id, 'kick', reason);

      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('👢 Xử lý vi phạm - Kick')
        .setDescription(
          `
  \`📌\` **Thông tin vi phạm**
  > **Người dùng:** <@${user.id}>
  > **Người xử lý:** <@${message.author.id}>
  > **ID:** \`${caseId}\`

  \`🚀\` **Lý do**
  > **Lý do:** ${reason}
  `
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Xử lý bởi: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      await (message.channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi khi kick:', error);
      return message.reply('⚠ Đã xảy ra lỗi khi đuổi người dùng.');
    }
  }
};

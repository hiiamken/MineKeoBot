import { Message, EmbedBuilder, TextChannel } from 'discord.js';
import { getAllInfractions } from '../../database/database';

export const allLogsCommand = {
  name: 'alllogs',
  description: 'Xem lịch sử vi phạm của tất cả người dùng (ban, kick, mute, unban, unmute, purge).',
  usage: '!alllogs',

  async execute(message: Message) {
    if (!message.member?.permissions.has('Administrator')) {
      return (message.channel as TextChannel).send('🚫 Bạn không có quyền sử dụng lệnh này.');
    }

    const infractions = await getAllInfractions();
    if (infractions.length === 0) {
      return (message.channel as TextChannel).send('✅ Không có lịch sử vi phạm nào.');
    }

    let logs = infractions.map(
      inf =>
        `**[${inf.timestamp}]** 🛑 **${inf.action.toUpperCase()}** - <@${inf.user_id}> bởi <@${inf.moderator_id}>\n📜 **Lý do:** ${inf.reason}`
    );

    const embed = new EmbedBuilder()
      .setColor('#DEA2DD')
      .setTitle('📜 Lịch Sử Vi Phạm')
      .setDescription(logs.slice(0, 10).join('\n'))
      .setFooter({ text: `Hiển thị 10 trên tổng số ${infractions.length} vi phạm.` })
      .setTimestamp();

    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

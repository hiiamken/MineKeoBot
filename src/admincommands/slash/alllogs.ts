import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, TextChannel, PermissionFlagsBits } from 'discord.js';
import { getAllInfractions } from '../../database/database';

export const allLogsCommand = {
  data: new SlashCommandBuilder()
    .setName('alllogs')
    .setDescription('Xem tất cả các hành động kỷ luật trong tất cả server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({ content: '⚠ Lệnh này chỉ có thể được sử dụng trong server.', ephemeral: true });
    }

    const infractions = await getAllInfractions();
    if (infractions.length === 0) {
      return interaction.reply({ content: '✅ Không có lịch sử vi phạm nào.', ephemeral: true });
    }

    let logs = infractions.map(
      inf => `**[${inf.timestamp}]** 🏷️ **${inf.action.toUpperCase()}** - <@${inf.user_id}> bởi <@${inf.moderator_id}>\n📜 **Lý do:** ${inf.reason}`
    );

    const embed = new EmbedBuilder()
      .setColor('#DEA2DD')
      .setTitle('📜 Lịch Sử Vi Phạm')
      .setDescription(logs.slice(0, 10).join('\n'))
      .setFooter({ text: `Hiển thị 10 trên tổng số ${infractions.length} vi phạm.` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

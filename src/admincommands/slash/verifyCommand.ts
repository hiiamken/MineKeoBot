// src/admincommands/slash/verifyCommand.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from 'discord.js';

const ALLOWED_USER_ID = '453380710024347658';

export const verifyCommand = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Gửi tin nhắn xác minh vào kênh xác minh'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== ALLOWED_USER_ID) {
      return interaction.reply({ content: 'Bạn không có quyền!', ephemeral: true });
    }
    if (!interaction.guild) {
      return interaction.reply({ content: 'Chỉ dùng trong server!', ephemeral: true });
    }

    const verifyChannel = interaction.channel as TextChannel;
    if (!verifyChannel) {
      return interaction.reply({ content: 'Không tìm thấy kênh!', ephemeral: true });
    }

    const serverLogo = interaction.guild.iconURL({ extension: 'png' }) || '';
    const verifyEmbed = new EmbedBuilder()
      .setTitle('🔐 XÁC MINH TÀI KHOẢN')
      .setDescription(`
Chào mừng bạn đến với \`${interaction.guild.name}\`
Vui lòng nhấn nút **Xác minh** bên dưới để truy cập các kênh khác.

Bằng việc xác minh, bạn đồng ý:
- Tuân thủ [Điều khoản dịch vụ](https://discord.com/terms).
- Tuân thủ \`nội quy chung\` của máy chủ.

\`(!)\` **Cảm ơn bạn đã giúp giữ cộng đồng an toàn!**
`)
      .setColor('#DEA2DD')
      .setThumbnail(serverLogo)
      .setFooter({ text: interaction.guild.name, iconURL: serverLogo });

    const verifyButton = new ButtonBuilder()
      .setCustomId('start_verification')
      .setLabel('Xác minh')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton);

    // Gửi message thường (mọi người thấy)
    await verifyChannel.send({ embeds: [verifyEmbed], components: [row] });

    // Trả lời ephemeral
    return interaction.reply({ content: '✅ Đã gửi tin nhắn xác minh!', ephemeral: true });
  },
};

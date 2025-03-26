import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField
  } from 'discord.js';
  import { getWelcomeChannel } from '../../config/config';
  import { buildFancyWelcomeEmbed } from '../../utils/welcomeUtils';
  
  export const testWelcomeSlashCommand = {
    data: new SlashCommandBuilder()
      .setName('testwelcome')
      .setDescription('Xem trước tin nhắn chào mừng (Admin Command - Slash)'),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
        return;
      }
  
      const welcomeChannelId = getWelcomeChannel(interaction.guild!.id);
      if (!welcomeChannelId) {
        await interaction.reply({
          content: 'Chưa có kênh chào mừng nào được cài đặt. Dùng /setwelcome <kênh> để thiết lập.',
          ephemeral: true,
        });
        return;
      }
  
      // Cài đặt các ID kênh cần thiết
      const gioithieu = '1122041534288764958';
      const nhanrole = '1106803900322951169';
      const hoidap = '1167855017848487947';
  
      // Fetch member để có đủ thông tin cho embed
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const embed = buildFancyWelcomeEmbed(
        member,
        { gioithieu, nhanrole, hoidap },
        'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png'
      );
  
      // Gửi tin nhắn với fetchReply để lấy message object, sau đó thêm reaction
      const replyMessage = await interaction.reply({ embeds: [embed], ephemeral: false, fetchReply: true });
      // fetchReply có thể trả về một đối tượng Message hoặc một mảng, ta xử lý như sau:
      if (Array.isArray(replyMessage)) {
        for (const msg of replyMessage) {
          await msg.react('<a:WelcomePink:1351498641793351691>');
          await msg.react('<a:WelcomePink1:1351498659589652571>');
          await msg.react('<a:welcum:1351498681521672222>');
        }
      } else {
        await replyMessage.react('<a:WelcomePink:1351498641793351691>');
        await replyMessage.react('<a:WelcomePink1:1351498659589652571>');
        await replyMessage.react('<a:welcum:1351498681521672222>');
      }
    },
  };
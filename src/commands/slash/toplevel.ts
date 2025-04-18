import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder
  } from 'discord.js';
  import { getTopPlayers } from '../../levels/levelManager';
  
  export const toplevelSlashCommand = {
    data: new SlashCommandBuilder()
      .setName('toplevel')
      .setDescription('Xem bảng xếp hạng 10 người có XP cao nhất (slash)'),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: 'Lệnh này chỉ có thể sử dụng trong server!', ephemeral: true });
        return;
      }
  
      // Lấy top 10 user
      const topPlayers = await getTopPlayers(guild.id, 10);
      if (topPlayers.length === 0) {
        return interaction.reply('Chưa có dữ liệu level cho server này!');
      }
  
      // Mỗi dòng: [ rank ] |Level: L Xp: X - @mention
      // Xuống dòng hiển thị (user_id)
      const lines = topPlayers.map((player, index) => {
        const rank = index + 1;
        return (
          `\`[ ${rank} ]\` **| Cấp:** \`${player.level}\` **Xp:** \`${player.xp}\` - <@${player.user_id}>\n` +
          `(\`${player.user_id}\`)`
        );
      });
  
      // Tạo Embed
      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('`✨` | Leveling Leaderboard')
        .setThumbnail('https://cdn.discordapp.com/attachments/1096806362060705904/1351584155124895775/mknetworkpng-removebg-preview.png')
        .setDescription(lines.join('\n\n'))
        .setTimestamp(); // không có footer
  
      await interaction.reply({ embeds: [embed], ephemeral: false });
    },
  };
  
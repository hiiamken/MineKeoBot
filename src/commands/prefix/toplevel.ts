import {
    Message,
    TextChannel,
    DMChannel,
    ThreadChannel,
    EmbedBuilder
  } from 'discord.js';
  import { getTopPlayers } from '../../levels/levelManager';
  
  export const toplevelPrefixCommand = {
    name: 'toplevel',
    description: 'Xem bảng xếp hạng 10 người có XP cao nhất (prefix)',
    async execute(message: Message, args: string[]) {
      if (!message.guild) return;
  
      // Lấy top 10 user
      const topPlayers = await getTopPlayers(message.guild.id, 10);
      if (topPlayers.length === 0) {
        // Không có ai
        if (message.channel.isTextBased()) {
          const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
          return ch.send('Chưa có dữ liệu level cho server này!');
        }
        return;
      }
  
      // Mỗi dòng: [ rank ] |Level: L Xp: X - @mention
      // Rồi xuống dòng hiển thị (user_id)
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
        .setDescription(lines.join('\n\n')) // cách nhau 1 dòng trống
        .setTimestamp(); // không có footer
  
      // Gửi Embed
      if (message.channel.isTextBased()) {
        const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
        await ch.send({ embeds: [embed] });
      }
    },
  };
  
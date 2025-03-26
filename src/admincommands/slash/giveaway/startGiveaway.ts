import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    TextChannel,
    Role
  } from 'discord.js';
  import { startGiveawayNumber } from '../../../database/giveaway';
  
  /**
   * Hàm parse chuỗi "1d2h30m" -> ms
   */
  function parseDuration(str: string): number {
    const pattern = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i;
    const match = str.toLowerCase().match(pattern);
    if (!match) {
      throw new Error(`Thời lượng không hợp lệ: ${str}`);
    }
  
    const days = match[1] ? parseInt(match[1], 10) : 0;
    const hours = match[2] ? parseInt(match[2], 10) : 0;
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    const seconds = match[4] ? parseInt(match[4], 10) : 0;
  
    const totalMs =
      days * 86400000 + hours * 3600000 + minutes * 60000 + seconds * 1000;
  
    if (totalMs <= 0) {
      throw new Error(`Thời lượng không hợp lệ: ${str}`);
    }
    return totalMs;
  }
  
  /**
   * Hàm parse bonus chuỗi. 
   * Ví dụ: "1108760828796215438=2, <@&999999>=4" -> [{ roleId, amount }, ...]
   */
  function parseBonusString(bonusStr: string): { roleId: string; amount: number }[] {
    if (!bonusStr.trim()) return [];
    const rawList = bonusStr.split(',').map(s => s.trim());
    const result: { roleId: string; amount: number }[] = [];
  
    for (const item of rawList) {
      // item dạng "1108760828796215438=2" hoặc "<@&999999>=4"
      const match = item.match(/<?@?&?(\d+)>?=?(\d+)?/);
      if (!match) continue;
  
      const roleId = match[1];
      const amount = match[2] ? parseInt(match[2], 10) : 0;
      if (!roleId) continue;
  
      result.push({ roleId, amount });
    }
    return result;
  }
  
  export const startGiveawayCommand = {
    data: new SlashCommandBuilder()
      .setName('startgiveaway')
      .setDescription('Tạo giveaway (4 yêu cầu + bonus roles qua 1 param).')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  
      // Thời lượng (vd: "1d2h", "30m", "45s", ...)
      .addStringOption(option =>
        option
          .setName('duration')
          .setDescription('Thời gian diễn ra (vd: 1d, 2h, 30m, 45s)')
          .setRequired(true)
      )
      // Số winners -> kiểu integer
      .addIntegerOption(option =>
        option
          .setName('winners')
          .setDescription('Số lượng người thắng')
          .setRequired(true)
      )
      // Phần thưởng -> string
      .addStringOption(option =>
        option
          .setName('prize')
          .setDescription('Phần thưởng chính của Giveaway')
          .setRequired(true)
      )
      // Kênh tổ chức -> channel
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('Kênh tổ chức giveaway')
          .setRequired(true)
      )
  
      // 4 yêu cầu tùy chọn (role/level/money/invite)
      .addRoleOption(option =>
        option
          .setName('requirerole')
          .setDescription('Người tham gia phải có role này?')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('requirelevel')
          .setDescription('Yêu cầu level tối thiểu?')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('requiremoney')
          .setDescription('Yêu cầu số tiền tối thiểu?')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('requireinvite')
          .setDescription('Yêu cầu số lần mời tối thiểu?')
          .setRequired(false)
      )
  
      // Bonus => 1 param string
      .addStringOption(option =>
        option
          .setName('bonus')
          .setDescription('VD: "1108760828796215438=2, <@&999999>=4"')
          .setRequired(false)
      ),
  
    async execute(interaction: ChatInputCommandInteraction) {
      // 1) Check xem có phải trong server
      if (!interaction.guild) {
        return interaction.reply({
          content: 'Lệnh này chỉ dùng trong server!',
          ephemeral: true
        });
      }
  
      // 2) Lấy param
      const durationInput = interaction.options.getString('duration', true);
      const winners = interaction.options.getInteger('winners', true); // number
      const prize = interaction.options.getString('prize', true);
      const channel = interaction.options.getChannel('channel', true) as TextChannel;
  
      // Parse thời gian -> number
      let durationMs: number;
      try {
        durationMs = parseDuration(durationInput);
      } catch {
        return interaction.reply({
          content: `❌ Thời lượng không hợp lệ: "${durationInput}".`,
          ephemeral: true
        });
      }
      const endTime = Date.now() + durationMs;
  
      // 3) Lấy 4 yêu cầu
      const roleRequire = interaction.options.getRole('requirerole');
      const requireLevel = interaction.options.getInteger('requirelevel') || 0;
      const requireMoney = interaction.options.getInteger('requiremoney') || 0;
      const requireInvite = interaction.options.getInteger('requireinvite') || 0;
      const requireRoleId = roleRequire ? roleRequire.id : '';
  
      // 4) Lấy bonus => parse
      const bonusStr = interaction.options.getString('bonus') || '';
      const bonusArr = parseBonusString(bonusStr);
      const bonusJSON = JSON.stringify(bonusArr);
  
      // 5) Tạo description cho embed
      let desc = `**Cảm ơn** <@${interaction.user.id}> đã tổ chức giveaway!\n\n`;
      desc += `**Thông tin:**\n`;
      desc += `• **Phần thưởng**: ${prize}\n`;
      desc += `• **Số người thắng**: ${winners}\n`;
      desc += `• **Kết thúc**: <t:${Math.floor(endTime / 1000)}:R>\n`;
      desc += `• **Số người tham gia**: 0\n\n`;
  
      // Yêu cầu
      const hasRequire =
        requireRoleId !== '' ||
        requireLevel > 0 ||
        requireMoney > 0 ||
        requireInvite > 0;
  
      if (hasRequire) {
        desc += `**Yêu cầu:**\n`;
        if (requireRoleId !== '') {
          desc += `• Role: <@&${requireRoleId}>\n`;
        }
        if (requireLevel > 0) {
          desc += `• Level tối thiểu: ${requireLevel}\n`;
        }
        if (requireMoney > 0) {
          // Format ví dụ 1000000 => "1.000.000"
          const fm = requireMoney.toLocaleString('vi-VN');
          desc += `• Tiền tối thiểu: ${fm} VNĐ\n`;
        }
        if (requireInvite > 0) {
          desc += `• Lời mời tối thiểu: ${requireInvite}\n`;
        }
        desc += '\n';
      }
  
      // Bonus
      if (bonusArr.length > 0) {
        desc += `**Bonus:**\n`;
        for (const b of bonusArr) {
          desc += `• <@&${b.roleId}> - x${b.amount} giải thưởng\n`;
        }
        desc += '\n';
      }
  
      desc += `> Nhấn **React 🎉** để tham gia!`;
  
      // 6) Tạo EMBED tạm
      let embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY ĐANG DIỄN RA! 🎉')
        .setColor('#DEA2DD')
        .setDescription(desc)
        .setTimestamp();
  
      // 7) Gửi embed (chưa có footer)
      const giveawayMessage = await channel.send({ embeds: [embed] });
await giveawayMessage.react('🎉');

const messageId: string = String(giveawayMessage.id);
  
      // 9) Thêm footer => "Message ID: ..."
      embed = EmbedBuilder.from(embed)
        .setFooter({ text: `ID: ${messageId}` });
      await giveawayMessage.edit({ embeds: [embed] });
  
      // 10) Lưu DB
      // startGiveawayNumber(...) => THỨ TỰ THAM SỐ PHẢI KHỚP
      await startGiveawayNumber(
        messageId,  // ✅ Đảm bảo gửi đúng ID nhận từ Discord
        interaction.guild.id,
        channel.id,
        prize,
        winners,
        endTime,
        interaction.user.id,
        requireRoleId,
        requireLevel,
        requireMoney,
        requireInvite,
        bonusJSON
    );
  
      // 11) Reply ephemeral
      await interaction.reply({
        content: `✅ Giveaway đã được tạo!\n→ Message ID: \`${messageId}\``,
        ephemeral: true
      });
    }
  };
  
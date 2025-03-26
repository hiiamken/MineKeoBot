import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { initDatabase } from '../../database/database';
import { adjustBalance, adjustBankBalance } from '../../database/economy'; // Import các hàm set tiền

export const dataCommand = {
  data: new SlashCommandBuilder()
    .setName('data')
    .setDescription('Quản lý dữ liệu người dùng (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Chỉ admin mới dùng được
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Reset dữ liệu của một người dùng.')
        .addStringOption((option) =>
          option.setName('target').setDescription('ID hoặc tên người dùng cần reset').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('data_type')
          .setDescription('Loại dữ liệu muốn reset.')
          .setRequired(true)
          .addChoices(
            { name: 'Levels', value: 'levels' },
            { name: 'Money', value: 'money' },
            { name: 'Bank', value: 'bank' },
            { name: 'Messages', value: 'messages' },
            { name: 'Invites', value: 'invites' },
            { name: 'Voicetimes', value: 'voicetimes' },
            { name: 'All', value: 'all' }
          )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set một giá trị cho dữ liệu của người dùng.')
        .addStringOption((option) =>
          option.setName('target').setDescription('ID hoặc tên người dùng cần set').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('data_type')
          .setDescription('Loại dữ liệu muốn set.')
          .setRequired(true)
          .addChoices(
            { name: 'Levels', value: 'levels' },
            { name: 'Money', value: 'money' },
            { name: 'Bank', value: 'bank' },
            { name: 'Messages', value: 'messages' },
            { name: 'Invites', value: 'invites' },
            { name: 'Voicetimes', value: 'voicetimes' }
          )
        )
        .addIntegerOption((option) =>
          option.setName('value').setDescription('Giá trị muốn set.').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();
    const targetInput = interaction.options.getString('target')!;
    const dataType = interaction.options.getString('data_type')!;

    // Xác định ID người dùng
    let targetUser;
    const userIdMatch = targetInput.match(/^<@!?(\d+)>$/);
    const userId = userIdMatch ? userIdMatch[1] : targetInput;

    try {
      targetUser = await interaction.client.users.fetch(userId);
    } catch (error) {
      const member = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === targetInput.toLowerCase() || m.nickname?.toLowerCase() === targetInput.toLowerCase());
      if (member) {
        targetUser = member.user;
      }
    }

    if (!targetUser) {
      return interaction.reply({ content: '❌ Không tìm thấy người dùng.', ephemeral: true });
    }

    const db = await initDatabase();

    if (subcommand === 'reset') {
      if (dataType === 'all') {
        const tablesToReset = ['levels', 'economy', 'messages', 'invites', 'voicetimes'];
        for (const table of tablesToReset) {
          await db.run(`UPDATE ${table} SET ${table === 'economy' ? 'money = 0, bank = 0' : table === 'levels' ? 'xp = 0, level = 1' : table === 'messages' ? 'message_count = 0' : table === 'invites' ? 'invite_count = 0' : 'total_time = 0'} WHERE guild_id = ? AND user_id = ?`, [interaction.guildId, targetUser.id]);
        }
        return interaction.reply({ content: `✅ Đã reset toàn bộ dữ liệu (Levels, Money, Bank, Messages, Invites, Voicetimes) cho người dùng ${targetUser.tag}.`, ephemeral: true });
      } else {
        let updateColumn = '';
        let resetValue: string | number = 0;
        switch (dataType) {
          case 'levels': updateColumn = 'xp = 0, level = 1'; break;
          case 'money': updateColumn = 'money = 0'; break;
          case 'bank': updateColumn = 'bank = 0'; break;
          case 'messages': updateColumn = 'message_count = 0'; break;
          case 'invites': updateColumn = 'invite_count = 0'; break;
          case 'voicetimes': updateColumn = 'total_time = 0'; break;
          default: return interaction.reply({ content: '❌ Loại dữ liệu không hợp lệ.', ephemeral: true });
        }
        await db.run(`UPDATE ${dataType} SET ${updateColumn} WHERE guild_id = ? AND user_id = ?`, [interaction.guildId, targetUser.id]);
        return interaction.reply({ content: `✅ Đã reset dữ liệu "${dataType}" cho người dùng ${targetUser.tag}.`, ephemeral: true });
      }
    } else if (subcommand === 'set') {
      const valueToSet = interaction.options.getInteger('value')!;
      let updateColumn = '';
      switch (dataType) {
        case 'levels': updateColumn = 'level'; break;
        case 'money': updateColumn = 'money'; break;
        case 'bank': updateColumn = 'bank'; break;
        case 'messages': updateColumn = 'message_count'; break;
        case 'invites': updateColumn = 'invite_count'; break;
        case 'voicetimes': updateColumn = 'total_time'; break;
        default: return interaction.reply({ content: '❌ Loại dữ liệu không hợp lệ.', ephemeral: true });
      }

      if (dataType === 'money') {
        await adjustBalance(interaction.guildId!, targetUser.id, valueToSet - (await (await db.get(`SELECT money FROM economy WHERE guild_id = ? AND user_id = ?`, [interaction.guildId, targetUser.id]))?.money || 0));
      } else if (dataType === 'bank') {
        await adjustBankBalance(interaction.guildId!, targetUser.id, valueToSet - (await (await db.get(`SELECT bank FROM economy WHERE guild_id = ? AND user_id = ?`, [interaction.guildId, targetUser.id]))?.bank || 0));
      } else {
        await db.run(`UPDATE ${dataType} SET ${updateColumn} = ? WHERE guild_id = ? AND user_id = ?`, [valueToSet, interaction.guildId, targetUser.id]);
      }
      return interaction.reply({ content: `✅ Đã set giá trị "${valueToSet}" cho "${dataType}" của người dùng ${targetUser.tag}.`, ephemeral: true });
    }
  },
};
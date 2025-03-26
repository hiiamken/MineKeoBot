import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits
  } from 'discord.js';
  import { setBackupInterval, clearBackupInterval } from '../../automod/backupManager';
  import { getGuildAutoBackup, setGuildAutoBackup } from '../../database/guildSettings'; // Tự bạn viết
  
  export const backupAutoCommand = {
    data: new SlashCommandBuilder()
      .setName('backup-auto')
      .setDescription('Bật/tắt/tình trạng backup tự động cho server này')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(sub =>
        sub.setName('on')
          .setDescription('Bật backup tự động')
          .addIntegerOption(opt =>
            opt.setName('interval')
              .setDescription('Khoảng thời gian (phút)')
              .setRequired(false)
          )
          .addIntegerOption(opt =>
            opt.setName('message_count')
              .setDescription('Số tin nhắn cần backup mỗi kênh')
              .setRequired(false)
          )
      )
      .addSubcommand(sub =>
        sub.setName('off')
          .setDescription('Tắt backup tự động')
      )
      .addSubcommand(sub =>
        sub.setName('check')
          .setDescription('Kiểm tra trạng thái backup tự động')
      ),
  
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) {
        return interaction.reply({ content: 'Chỉ dùng trong server.', ephemeral: true });
      }
  
      const sub = interaction.options.getSubcommand();
      await interaction.deferReply({ ephemeral: true });
  
      // Lấy config auto_backup
      let autoBackup = await getGuildAutoBackup(guild.id);
  
      if (sub === 'on') {
        const interval = interaction.options.getInteger('interval') ?? 30; // mặc định 30p
        const messageCount = interaction.options.getInteger('message_count') ?? 100;
  
        if (autoBackup === 1) {
          // Đã bật => clear cũ, set lại interval
          clearBackupInterval(guild.id);
        }
  
        // Đánh dấu auto_backup=1 trong DB
        await setGuildAutoBackup(guild.id, 1);
        autoBackup = 1;
  
        // Gọi setBackupInterval
        setBackupInterval(guild, interval, messageCount);
  
        await interaction.editReply(`Đã **bật** backup tự động cho server này (mỗi ${interval} phút, ${messageCount} tin/1 kênh).`);
      }
      else if (sub === 'off') {
        if (autoBackup === 1) {
          // Tắt
          clearBackupInterval(guild.id);
          await setGuildAutoBackup(guild.id, 0);
          autoBackup = 0;
          await interaction.editReply('Đã **tắt** backup tự động cho server này.');
        } else {
          await interaction.editReply('Hiện tại **đang tắt** backup tự động.');
        }
      }
      else if (sub === 'check') {
        if (autoBackup === 1) {
          await interaction.editReply('Backup tự động đang **bật** cho server này.');
        } else {
          await interaction.editReply('Backup tự động đang **tắt** cho server này.');
        }
      }
    }
  };

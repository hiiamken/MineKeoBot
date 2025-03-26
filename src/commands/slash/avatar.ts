// src/commands/slash/avatar.ts
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    AttachmentBuilder,
  } from 'discord.js';
  import { emojis } from '../../utils/emojis';
  import { getRandomAvatarResponse } from '../../utils/responses';
  import { getSharpenedAvatar } from '../../utils/imageProcessing';
  
  export const avatarSlashCommand = {
    data: new SlashCommandBuilder()
      .setName('ava')
      .setDescription('Xem avatar của một người dùng (slash)')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('Người dùng cần xem avatar')
          .setRequired(true)
      )
      .addBooleanOption(option =>
        option.setName('private')
          .setDescription('Hiển thị kết quả chỉ cho bạn (ẩn) hay công khai?')
          .setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser('target');
      if (!user) {
        await interaction.reply({ content: `${emojis.redCandycane} Không tìm thấy người dùng!`, ephemeral: true });
        return;
      }
      const ephemeral = interaction.options.getBoolean('private') ?? false;
      const avatarUrl = user.displayAvatarURL({ forceStatic: false, size: 1024 });
  
      // Xử lý làm nét ảnh avatar
      const sharpenedBuffer = await getSharpenedAvatar(avatarUrl);
      const attachment = new AttachmentBuilder(sharpenedBuffer, { name: 'avatar_sharpened.png' });
  
      const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setAuthor({ name: user.tag, iconURL: avatarUrl })
        .setTitle('Avatar hiển thị')
        .setImage('attachment://avatar_sharpened.png')
        .setFooter({ text: 'MineKeo NetWork' })
        .setTimestamp();
  
      const replyContent = getRandomAvatarResponse(user.username, emojis.redCandycane);
  
      await interaction.reply({
        content: replyContent,
        embeds: [embed],
        files: [attachment],
        ephemeral,
      });
    },
  };
  
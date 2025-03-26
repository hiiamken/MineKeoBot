import {
  Message,
  TextChannel,
  DMChannel,
  ThreadChannel,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { emojis } from '../../utils/emojis';
import { getRandomAvatarResponse } from '../../utils/responses';
import { getSharpenedAvatar } from '../../utils/imageProcessing';

export const avatarPrefixCommand = {
  name: 'ava',
  description: 'Xem avatar của một người dùng (prefix)',
  async execute(message: Message, args: string[]) {
    if (!message.channel.isTextBased()) return;
    const channel = message.channel as TextChannel | DMChannel | ThreadChannel;

    if (args.length === 0) {
      await channel.send(`${emojis.redCandycane} Vui lòng cung cấp user ID hoặc mention (@người_dung)!`);
      return;
    }

    const rawInput = args[0];
    const match = rawInput.match(/^<@!?(\d+)>$/);
    const userId = match ? match[1] : rawInput;

    try {
      const user = await message.client.users.fetch(userId);
      const avatarUrl = user.displayAvatarURL({ forceStatic: false, size: 1024 });
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

      await channel.send({
        content: replyContent,
        embeds: [embed],
        files: [attachment],
      });
    } catch (error) {
      console.error(error);
      await channel.send(`${emojis.redCandycane} Không tìm thấy người dùng!`);
    }
  },
};

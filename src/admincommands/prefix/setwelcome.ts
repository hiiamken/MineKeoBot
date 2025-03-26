// src/admincommands/prefix/setwelcome.ts
import {
    Message,
    TextChannel,
    DMChannel,
    ThreadChannel,
    PermissionsBitField
  } from 'discord.js';
  import { setWelcomeChannel } from '../../config/config'; 
  // ↑ prefix => admincommands => (..)
  // ↑ admincommands => src => (..)
  // => ../../config/config
  
  export const setWelcomeCommand = {
    name: 'setwelcome',
    description: 'Đặt kênh chào mừng cho server này (Admin Command)',
    async execute(message: Message, args: string[]) {
      // Kiểm tra quyền Admin
      if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (message.channel.isTextBased()) {
          const ch = message.channel as TextChannel | DMChannel | ThreadChannel;
          await ch.send('Bạn không có quyền sử dụng lệnh này.');
        }
        return;
      }
  
      if (!message.channel.isTextBased()) return;
      const channel = message.channel as TextChannel | DMChannel | ThreadChannel;
  
      if (args.length === 0) {
        await channel.send('Vui lòng tag kênh hoặc cung cấp ID kênh. Ví dụ: `!setwelcome #welcome`');
        return;
      }
  
      let channelId = args[0];
      const match = channelId.match(/^<#(\d+)>$/);
      if (match) {
        channelId = match[1];
      }
  
      setWelcomeChannel(message.guild!.id, channelId);
      await channel.send(`Đã đặt kênh chào mừng cho server này là <#${channelId}>`);
    },
  };
  
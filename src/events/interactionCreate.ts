// src/events/interactionCreate.ts

import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { slashCommandsCollection, adminSlashCommandsCollection } from '../bot';
import {
  handleStartVerification,
} from '../admincommands/slash/verifyInteraction';

interface SlashCommand {
  data: {
    name: string;
    description: string;
  };
  execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
  autocomplete?: (interaction: any) => Promise<void> | void;
}

/**
 * Hàm handleInteraction: Bắt mọi loại Interaction và chuyển đến logic tương ứng.
 */
export async function handleInteraction(interaction: Interaction) {
  // 1) Slash Commands
  if (interaction.isChatInputCommand()) {
    const command =
      slashCommandsCollection.get(interaction.commandName) ||
      adminSlashCommandsCollection.get(interaction.commandName);

    if (!command || typeof command.execute !== 'function') {
      console.error(`Command "${interaction.commandName}" không tồn tại hoặc không có phương thức execute.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Lỗi khi thực thi lệnh "${interaction.commandName}":`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Đã xảy ra lỗi!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Đã xảy ra lỗi!', ephemeral: true });
      }
    }
  }

  // 2) Button Interactions
  else if (interaction.isButton()) {
    const button = interaction as ButtonInteraction;
    const { customId } = button;

    try {
      // Chỉ còn nút “start_verification”
      if (customId === 'start_verification') {
        await handleStartVerification(button);
      }
      // Nếu cần thêm nút khác, thêm ở đây
    } catch (error) {
      console.error('Lỗi khi xử lý buttonInteraction:', error);
      if (!button.replied && !button.deferred) {
        await button.reply({ content: 'Đã xảy ra lỗi khi xử lý nút bấm!', ephemeral: true });
      }
    }
  }

  // 3) Các loại Interaction khác (Modal, Autocomplete, ...) đã bỏ
  // else if (interaction.isModalSubmit()) { ... }
  // else if (interaction.isAutocomplete()) { ... }
}

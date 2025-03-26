"use strict";
// src/events/interactionCreate.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = handleInteraction;
const bot_1 = require("../bot");
const verifyInteraction_1 = require("../admincommands/slash/verifyInteraction");
/**
 * Hàm handleInteraction: Bắt mọi loại Interaction và chuyển đến logic tương ứng.
 */
async function handleInteraction(interaction) {
    // 1) Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = bot_1.slashCommandsCollection.get(interaction.commandName) ||
            bot_1.adminSlashCommandsCollection.get(interaction.commandName);
        if (!command || typeof command.execute !== 'function') {
            console.error(`Command "${interaction.commandName}" không tồn tại hoặc không có phương thức execute.`);
            return;
        }
        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error(`Lỗi khi thực thi lệnh "${interaction.commandName}":`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Đã xảy ra lỗi!', ephemeral: true });
            }
            else {
                await interaction.reply({ content: 'Đã xảy ra lỗi!', ephemeral: true });
            }
        }
    }
    // 2) Button Interactions
    else if (interaction.isButton()) {
        const button = interaction;
        const { customId } = button;
        try {
            // Chỉ còn nút “start_verification”
            if (customId === 'start_verification') {
                await (0, verifyInteraction_1.handleStartVerification)(button);
            }
            // Nếu cần thêm nút khác, thêm ở đây
        }
        catch (error) {
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

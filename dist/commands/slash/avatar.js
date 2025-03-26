"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarSlashCommand = void 0;
// src/commands/slash/avatar.ts
const discord_js_1 = require("discord.js");
const emojis_1 = require("../../utils/emojis");
const responses_1 = require("../../utils/responses");
const imageProcessing_1 = require("../../utils/imageProcessing");
exports.avatarSlashCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ava')
        .setDescription('Xem avatar của một người dùng (slash)')
        .addUserOption(option => option.setName('target')
        .setDescription('Người dùng cần xem avatar')
        .setRequired(true))
        .addBooleanOption(option => option.setName('private')
        .setDescription('Hiển thị kết quả chỉ cho bạn (ẩn) hay công khai?')
        .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        if (!user) {
            await interaction.reply({ content: `${emojis_1.emojis.redCandycane} Không tìm thấy người dùng!`, ephemeral: true });
            return;
        }
        const ephemeral = interaction.options.getBoolean('private') ?? false;
        const avatarUrl = user.displayAvatarURL({ forceStatic: false, size: 1024 });
        // Xử lý làm nét ảnh avatar
        const sharpenedBuffer = await (0, imageProcessing_1.getSharpenedAvatar)(avatarUrl);
        const attachment = new discord_js_1.AttachmentBuilder(sharpenedBuffer, { name: 'avatar_sharpened.png' });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#DEA2DD')
            .setAuthor({ name: user.tag, iconURL: avatarUrl })
            .setTitle('Avatar hiển thị')
            .setImage('attachment://avatar_sharpened.png')
            .setFooter({ text: 'MineKeo NetWork' })
            .setTimestamp();
        const replyContent = (0, responses_1.getRandomAvatarResponse)(user.username, emojis_1.emojis.redCandycane);
        await interaction.reply({
            content: replyContent,
            embeds: [embed],
            files: [attachment],
            ephemeral,
        });
    },
};

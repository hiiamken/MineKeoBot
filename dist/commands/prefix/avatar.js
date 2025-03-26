"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarPrefixCommand = void 0;
const discord_js_1 = require("discord.js");
const emojis_1 = require("../../utils/emojis");
const responses_1 = require("../../utils/responses");
const imageProcessing_1 = require("../../utils/imageProcessing");
exports.avatarPrefixCommand = {
    name: 'ava',
    description: 'Xem avatar của một người dùng (prefix)',
    async execute(message, args) {
        if (!message.channel.isTextBased())
            return;
        const channel = message.channel;
        if (args.length === 0) {
            await channel.send(`${emojis_1.emojis.redCandycane} Vui lòng cung cấp user ID hoặc mention (@người_dung)!`);
            return;
        }
        const rawInput = args[0];
        const match = rawInput.match(/^<@!?(\d+)>$/);
        const userId = match ? match[1] : rawInput;
        try {
            const user = await message.client.users.fetch(userId);
            const avatarUrl = user.displayAvatarURL({ forceStatic: false, size: 1024 });
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
            await channel.send({
                content: replyContent,
                embeds: [embed],
                files: [attachment],
            });
        }
        catch (error) {
            console.error(error);
            await channel.send(`${emojis_1.emojis.redCandycane} Không tìm thấy người dùng!`);
        }
    },
};

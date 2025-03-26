"use strict";
// src/handlers/reactionRoleAutoRefresh.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoRefreshReactionRoleEmbeds = autoRefreshReactionRoleEmbeds;
const bot_1 = require("../bot");
const database_1 = require("../database/database");
const discord_js_1 = require("discord.js");
const reactionRoleLoader_1 = require("./reactionRoleLoader");
async function autoRefreshReactionRoleEmbeds() {
    const db = await (0, database_1.initDatabase)();
    // Lấy tất cả embed Reaction Role từ DB
    const records = await db.all(`SELECT * FROM reaction_role_messages`);
    for (const record of records) {
        const { message_id, guild_id, channel_id } = record;
        try {
            const guild = bot_1.client.guilds.cache.get(guild_id);
            if (!guild)
                continue;
            const channel = guild.channels.cache.get(channel_id);
            if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
                continue;
            const textChannel = channel;
            // Thử fetch message
            const msg = await textChannel.messages.fetch(message_id).catch(() => null);
            if (!msg) {
                // Nếu không tìm thấy, xoá record DB
                await (0, reactionRoleLoader_1.deleteReactionRoleMessage)(message_id);
                // Gửi log DM tới admin (ADMIN_USER_ID, thay thế bằng ID admin thực tế)
                try {
                    const adminUser = await bot_1.client.users.fetch('ADMIN_USER_ID');
                    const logEmbed = new discord_js_1.EmbedBuilder()
                        .setColor('#e74c3c')
                        .setTitle('Embed Reaction Role Bị Xoá')
                        .setDescription(`Embed Reaction Role có ID \`${message_id}\` trong kênh <#${channel_id}> đã bị xoá.\n` +
                        `Lưu ý: Có thể đã bị xoá bởi ai đó hoặc do lỗi hệ thống.`)
                        .setTimestamp();
                    await adminUser.send({ embeds: [logEmbed] });
                }
                catch (err) {
                    console.error('Không thể gửi DM log cho admin:', err);
                }
            }
            else {
                // Nếu message vẫn tồn tại, bạn có thể cập nhật nội dung embed nếu cần
                // Ví dụ, cập nhật timestamp, hoặc nội dung (nếu có thay đổi)
                // Hiện tại, ta không làm gì.
            }
        }
        catch (error) {
            console.error(`Lỗi khi xử lý embed Reaction Role với ID ${message_id}:`, error);
        }
    }
}

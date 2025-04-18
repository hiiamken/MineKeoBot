"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGuildMemberAdd = onGuildMemberAdd;
exports.sendWelcomeMessage = sendWelcomeMessage;
const config_1 = require("../config/config");
const welcomeUtils_1 = require("../utils/welcomeUtils");
const verifyLog_1 = require("../database/verifyLog");
const autoroleHandler_1 = require("./autoroleHandler");
// ✅ Định nghĩa ID Role
const UNVERIFIED_ROLE_ID = '1132115518141235220';
async function onGuildMemberAdd(member) {
    // Gán role tự động cho thành viên mới
    await (0, autoroleHandler_1.handleAutorole)(member);
    // ✅ Kiểm tra nếu user đã xác minh trước đó
    if (await (0, verifyLog_1.isUserVerified)(member.id)) {
        await sendWelcomeMessage(member);
    }
    else {
        // **Thêm role "Chưa xác thực" cho người mới vào**
        const unverifiedRole = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);
        if (unverifiedRole) {
            await member.roles.add(unverifiedRole);
        }
    }
}
/**
 * Hàm gửi tin nhắn chào mừng khi user xác minh xong.
 */
async function sendWelcomeMessage(member) {
    // Lấy ID kênh chào mừng từ config
    const welcomeChannelId = (0, config_1.getWelcomeChannel)(member.guild.id);
    if (!welcomeChannelId)
        return;
    // Tìm kênh chào mừng
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    if (!welcomeChannel)
        return;
    // Gọi hàm tạo embed chào mừng từ welcomeUtils.ts
    const welcomeEmbed = (0, welcomeUtils_1.buildFancyWelcomeEmbed)(member, {
        gioithieu: '1122041534288764958',
        nhanrole: '1106803900322951169',
        hoidap: '1167855017848487947'
    });
    // Gửi tin nhắn chào mừng và thêm reaction
    try {
        const welcomeMessage = await welcomeChannel.send({ embeds: [welcomeEmbed] });
        // **Thêm 3 reaction**
        await welcomeMessage.react('<a:WelcomePink:1351498641793351691>');
        await welcomeMessage.react('<a:WelcomePink1:1351498659589652571>');
        await welcomeMessage.react('<a:welcum:1351498681521672222>');
    }
    catch (error) {
        console.error("❌ Lỗi khi gửi tin nhắn chào mừng hoặc thêm reaction:", error);
    }
}

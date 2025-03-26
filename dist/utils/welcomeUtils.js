"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFancyWelcomeEmbed = buildFancyWelcomeEmbed;
const DefaultEmbed_1 = require("./DefaultEmbed");
// Danh sách câu chào từ nhiều quốc gia 🌍
const greetings = [
    "Hello", "Xin chào", "Bonjour", "Hola", "Ciao", "こんにちは",
    "안녕하세요", "Olá", "Salam"
];
// Hàm chọn ngẫu nhiên một câu chào
function getRandomGreeting() {
    return greetings[Math.floor(Math.random() * greetings.length)];
}
function buildFancyWelcomeEmbed(member, channelIds, authorIconURL) {
    const { guild } = member;
    // **GIF Chào Mừng**
    const welcomeGifUrl = 'https://cdn.discordapp.com/attachments/1096806362060705904/1351785375403606087/af2bc2562b620cd327ae39478d924723.gif?ex=67dba3bc&is=67da523c&hm=315eedce09f6d222432781d1d9100f22482822c5b7de9c7bdef73be9666cbe12&';
    // **Mô tả chính**
    const description = `
Hi vọng <@${member.id}> sẽ có những trải nghiệm
đáng nhớ tại **MineKeo NetWork**! ✨

> **IP PC**: \`minekeo.com\`
> **IP PE**: \`pe.minekeo.com\`

> **Thông tin máy chủ**: <#${channelIds.gioithieu}>
> **Nhận role**: <#${channelIds.nhanrole}>
> **Hỏi-đáp**: <#${channelIds.hoidap}>
  `;
    return new DefaultEmbed_1.DefaultEmbed()
        .setAuthor({
        name: `${getRandomGreeting()}, ${member.displayName}!`,
        iconURL: authorIconURL || member.user.displayAvatarURL({ forceStatic: false, size: 128 })
    })
        .setDescription(description)
        .setThumbnail(member.user.displayAvatarURL({ forceStatic: false, size: 512 }))
        .setImage(welcomeGifUrl) // **Thêm GIF chào mừng**
        .setFooter({ text: `Bạn là người thứ ${guild.memberCount} trong máy chủ!` })
        .setTimestamp();
}

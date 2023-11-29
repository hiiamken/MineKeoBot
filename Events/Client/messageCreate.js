module.exports = {
    name: "messageCreate",
    async execute(message) {
        if (message.author.bot) return;

        // Kiểm tra xem người gửi có vai trò phù hợp không
        const allowedRoleIDs = ["1121667704298946600", "1121764644403560469"]; // Thay thế bằng ID của các vai trò được phép
        const senderRoleIDs = message.member.roles.cache.map(role => role.id);

        // Kiểm tra xem có tag role không
        const mentionedRoles = message.mentions.roles.map(role => role.id);

        // Kiểm tra xem có vai trò cấm không được tag không
        const forbiddenRoleIDs = ["1121667704298946600", "1178278042053910558", "1135945189165387889", "1121764644403560469"]; // Thay thế bằng ID của các vai trò cấm được tag
        const hasForbiddenRole = mentionedRoles.some(roleID => forbiddenRoleIDs.includes(roleID));

        // Kiểm tra xem có tag người cụ thể không (ví dụ: admin)
        const forbiddenUserID = "453380710024347658"; // Thay thế bằng ID của người cụ thể cần cấm tag
        const hasForbiddenUser = mentionedRoles.includes(forbiddenUserID);

        // Kiểm tra xem có link http:// hoặc https:// không được phép
        const forbiddenChannels = ["1122039700430016594", "1126163060206342185", "1170763165534003300"]; // Thay thế bằng ID của các kênh cấm
        const isForbiddenChannel = forbiddenChannels.includes(message.channel.id);
        const hasForbiddenLink = message.content.includes("https://");

        if (!(allowedRoleIDs.some(roleID => senderRoleIDs.includes(roleID))) &&
            (hasForbiddenRole || hasForbiddenUser || (hasForbiddenLink && isForbiddenChannel))) {
            message.delete();
            if (hasForbiddenRole) {
                message.channel.send({ content: `Này ${message.author}, bạn không được phép tag vai trò cụ thể ở đây!` });
            } else if (hasForbiddenUser) {
                message.channel.send({ content: `Này ${message.author}, bạn không được phép tag Staff ở đây!` });
            } else if (hasForbiddenLink && isForbiddenChannel) {
                message.channel.send({ content: `Này ${message.author}, bạn không được phép gửi link ở đây!` });
            }
        }
    }
};

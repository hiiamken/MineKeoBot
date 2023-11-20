module.exports = {
    name: "messageCreate",
    async execute(message) {
        if (message.author.bot) return;

        // Kiểm tra xem người gửi có vai trò phù hợp không
        const allowedRoleIDs = ["1121667704298946600", "1121764644403560469"]; // Thay thế bằng ID của các vai trò được phép
        const senderRoleIDs = message.member.roles.cache.map(role => role.id);

        if (!(allowedRoleIDs.some(roleID => senderRoleIDs.includes(roleID))) &&
            (message.content.includes("https://") || message.content.includes("http://") || message.content.includes("discord.gg"))) {
            message.delete();
            message.channel.send({ content: `Này ${message.author}, bạn không được phép gửi link ở đây!` });
        }
    }
};

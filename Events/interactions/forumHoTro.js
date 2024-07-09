const { EmbedBuilder, Events } = require("discord.js");

module.exports = {
    name: Events.ThreadCreate, // Sử dụng sự kiện ThreadCreate

    async execute(thread) {
        // Thêm mention đến role
        const roleMention = `<@&1135945189165387889>`;

        let embed = new EmbedBuilder();
        let content = `${roleMention}`; // Khởi tạo nội dung tin nhắn với mention đến role
        switch (thread.parentId) {
            case "1194438124990910585": // Trường hợp báo lỗi
                embed.setTitle("Báo lỗi")
                    .setDescription("Cảm ơn bạn đã báo lỗi. Vui lòng chờ đội ngũ hỗ trợ xem xét và phản hồi!\n\nNếu vấn đề đã được giải quyết, vui lòng sử dụng lệnh `/close`.")
                    .setColor(0xFF0000)
                    .setTimestamp();
                break;
            case "1194439616359571527": // Trường hợp góp ý
                embed.setTitle("Góp ý")
                    .setDescription("Cảm ơn bạn đã góp ý. Chúng tôi luôn hoan nghênh mọi ý kiến đóng góp để cải thiện dịch vụ!\n\nNếu vấn đề đã được giải quyết, vui lòng sử dụng lệnh `/close`.")
                    .setColor(0x00FF00)
                    .setTimestamp();
                break;
            default:
                // Nếu không phải hai kênh trên, không làm gì cả
                return;
        }

        await thread.send({ content, embeds: [embed] });
    }
}
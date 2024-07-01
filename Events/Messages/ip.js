const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "messageCreate",

    async execute(message) {
        if (!message.guild || message.author.bot) return;

        // Xử lý lệnh !ip
        if (message.content === "!ip") {
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Địa chỉ của MineKeo NetWork`,
                    iconURL: "https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png"
                })
                .setDescription("Máy chủ MineKeo hiện tại hỗ trợ 2 nền tảng đó là Java và Bedrock. Các bạn hãy chọn IP phù hợp để tham gia vào máy chủ nhé!")
                .setColor(0xecb2fb)
                .addFields(
                    { name: "IP Máy tính (PC)", value: "minekeo.com | 1.7.x - 1.21", inline: true },
                    { name: "IP Điện thoại (PE)", value: "pe.minekeo.com (19132) | 1.20.80 - 1.21.0", inline: true }
                )
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
            return; // Dừng xử lý nếu là lệnh !ip
        }
    }
};
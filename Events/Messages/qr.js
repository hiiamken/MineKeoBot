const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "messageCreate",

    async execute(message) {
        if (!message.guild || message.author.bot) return;

        if (message.content === "!donate" || message.content === "!qr") {
            const embed = new EmbedBuilder()
                .setTitle("Thông tin ngân hàng")
                .setDescription("> Techcombank: **19036930253011 - TRAN VIET THUONG**\n> Momo: **0968238901 - TRAN VIET THUONG**\n> Paypal: **trvietthuong@gmail.com**\n\nTất cả giao dịch nạp qua ngân hàng đều được **cộng thêm 20% giá trị**.\nNếu chưa nhận được xu hãy tạo ticket tại <#1189001748568879175> để được hỗ trợ nhanh nhất.")
                .setImage("https://cdn.discordapp.com/attachments/1089617786780786748/1257204538147078165/image.png?ex=66838e77&is=66823cf7&hm=0274e36e2e87c72aa728b54cbcdbb557772038c9a40fc394f558e439d73a5a14&")
                .setColor("#C68BEA");

            await message.channel.send({ embeds: [embed] });
            return;
        }
    }
};
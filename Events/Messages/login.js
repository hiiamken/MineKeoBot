const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "messageCreate",

    async execute(message) {
        if (!message.guild || message.author.bot) return;

        if (message.content === "!login") {
            const embed = new EmbedBuilder()
                .setTitle("Tại sao tôi không sử dụng được /register để đăng kí tài khoản?")
                .setDescription("Bạn cần trả lời câu hỏi ở khung chat\n- Nếu như đang sử dụng tài khoản Premium, thì bấm Đồng ý. Nick premium sẽ không cần phải /login và /register\n- Nếu như sử dụng tài khoản Crack thì bấm Từ chối sau đó /register như bình thường")
                .setImage("https://cdn.discordapp.com/attachments/1089617786780786748/1245393246528606362/dangkiregister.gif?ex=66876398&is=66861218&hm=b790060d2517f69d45d5b98d44293254fc142ddc41296b3ef39003f66089ed11&")
                .setColor("#C68BEA");

            await message.channel.send({ embeds: [embed] });
            return;
        }
    }
};
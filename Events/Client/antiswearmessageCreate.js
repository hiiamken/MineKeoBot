const {
    Client,
    EmbedBuilder,
} = require("discord.js");
const antiswearSchema = require("../../Models/antiswear");
const antiswearLogSchema = require("../../Models/antiswearLogChannel");

module.exports = {
    name: "messageCreate",
    /**
     * @param {Client} client
     */
    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;

        const guild = message.guild;

        let requireDB = await antiswearSchema.findOne({ _id: guild.id });
        const logSchema = await antiswearLogSchema.findOne({ Guild: guild.id });
        if (!logSchema) return;
        if (!requireDB) return;

        if (requireDB.logs === false) return;

        if (requireDB.logs === true) {

            const scamLinks = require('../../badwords.json');
            const scamlinks = scamLinks.known_links;

            const embed = new EmbedBuilder()
                .setColor(0xECB2FB)
                .setDescription(`:warning: | <@${message.author.id}> đã được cảnh báo vì sử dụng từ ngữ không tốt.`)

            // https://github.com/nateethegreat/Discord-Scam-Links

            const content = message.content.toLowerCase();
            const words = content.split(' ');

            for (const word of words) {
                if (scamlinks.includes(word)) {
                    await message.delete();

                    // Đặt ID kênh log vào đây.
                    const logChannel = client.channels.cache.get(logSchema.logChannel);

                    // Đối với việc gửi tin nhắn vào kênh gốc.
                    message.channel.send({ embeds: [embed] });

                    if (!logChannel) return;
                    else {
                        // Đối với việc gửi tin nhắn đến kênh log.
                        logChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xECB2FB)
                                    .setDescription(`<@${message.author.id}> đã được cảnh báo vì sử dụng từ ngữ không tốt.\n\`\`\`${message.content}\`\`\``)
                                    .setFooter({ text: `ID Người Dùng: ${message.author.id}` })
                                    .setTimestamp()
                            ],
                        });

                        // Các đăng nhập nút quản trị không được bao gồm.
                    }
                }
            }
        };
    }
}

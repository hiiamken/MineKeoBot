const {
    Client,
    EmbedBuilder,
} = require("discord.js");
const antiscamSchema = require("../../Models/antiscam");
const antiscamLogSchema = require("../../Models/antiscamLogChannel");

module.exports = {
    name: "messageCreate",
    /**
     * @param {Client} client
     */
    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;

        const guild = message.guild;

        let requireDB = await antiscamSchema.findOne({ _id: guild.id });
        const logSchema = await antiscamLogSchema.findOne({ Guild: guild.id });
        if (!logSchema) return;
        if (!requireDB) return;

        if (requireDB.logs === false) return;

        if (requireDB.logs === true) {

            const scamLinks = require('../../scamLinks.json');
            const scamlinks = scamLinks.known_links;

            const embed = new EmbedBuilder()
                .setColor(0xecb2fb)
                .setDescription(`:warning: | <@${message.author.id}> đã gửi một liên kết có hại.`)

            const content = message.content.toLowerCase();
            const words = content.split(' ');

            for (const word of words) {
                if (scamlinks.includes(word)) {
                    await message.delete();

                    // Đặt ID kênh log vào đây.
                    const logChannel = client.channels.cache.get(logSchema.logChannel);

                    // Để gửi tin nhắn vào kênh gốc.
                    message.channel.send({ embeds: [embed] });

                    if (!logChannel) return;
                    else {
                        // Để gửi tin nhắn vào kênh log.
                        logChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xecb2fb)
                                    .setDescription(`<@${message.author.id}> đã gửi một liên kết có hại.\n\`\`\`${message.content}\`\`\``)
                                    .setFooter({ text: `ID Người Dùng: ${message.author.id}` })
                                    .setTimestamp()
                            ],
                        });
                    }
                }
            }
        };
    }
}

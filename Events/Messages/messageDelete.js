const countingScheme = require("../../Models/Counting");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "messageDelete",

    async execute(message) {
        // Check if the message has content property
        if (!message.content) return;

        const guildId = message.guild.id;

        if (message.author.bot) return;

        if (isNaN(message.content)) return;

        countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
            if (!data || !data.Channel) {
                return;
            }

            if (message.channel.id === data.Channel) {
                const embed = new EmbedBuilder()
                    .setDescription(`**Trời ơi!** ${message.author} vừa xoá tin nhắn.\nSố cuối cùng là \`${message.content}\``)
                    .setColor(0xECB2FB)
                    .setTimestamp();

                message.channel.send({ embeds: [embed] });
            }

            if (err) {
                console.log(err);
            }
        });
    },
};

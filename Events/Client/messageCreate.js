module.exports = {
    name: "messageCreate",
    async execute(message) {
        if (message.author.bot) return;

        if (message.content.includes("https://") || message.content.includes("http://") || message.content.includes("discord.gg")) {
            message.delete();

            message.channel.send({content: `Này ${message.author}, không được gửi link ở đây nha!`})
        }
    }
}
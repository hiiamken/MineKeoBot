const countingScheme = require("../../Models/Counting");

function isValidMathExpression(str) {
    const regex = /^[\d+\-*/\s()**.]*$/;
    return regex.test(str);
}

module.exports = {
    name: "messageUpdate",

    async execute(oldMessage, newMessage) {
        const guildId = oldMessage.guild.id;

        let oldNumber = NaN;
        if (oldMessage.content) {
            const oldContent = oldMessage.content.replace(/\^/g, "**").replace(/pow/g, "**").replace(/sqrt/g, "Math.sqrt").replace(/,/g, ".");
            if (isValidMathExpression(oldContent)) {
                oldNumber = Math.round(eval(oldContent));
            }
        }

        let newNumber = NaN;
        if (newMessage.content) {
            const newContent = newMessage.content.replace(/\^/g, "**").replace(/pow/g, "**").replace(/sqrt/g, "Math.sqrt").replace(/,/g, ".");
            if (isValidMathExpression(newContent)) {
                newNumber = Math.round(eval(newContent));
            }
        }

        countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
            if (!data) return;

            // Check if the message is from the counting channel
            if (newMessage.channel.id !== data.Channel) return;

            newMessage.delete();

            if (!isNaN(oldNumber)) {
                data.Count = oldNumber;
            }

            data.isNumberEntered = false;
            data.LastPerson = "";

            await data.save();

            // Send a message and react to it
            const cheatingMessage = await oldMessage.channel.send(`<@${newMessage.author.id}> vừa gian lận, tin nhắn đã bị xoá`);
        });
    },
};
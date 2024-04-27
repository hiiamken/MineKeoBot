const countingScheme = require("../../Models/Counting");
const Ranking = require("../../Models/Ranking");

let gameState = {
  Count: 1,
  LastPerson: null,
  isNumberEntered: false,
  justReset: false,
};

module.exports = {
  name: "messageCreate",

  async execute(message) {
    const guildId = message.guild.id;

    if (message.author.bot) return;

    const isNumberOrExpression = /^[\d+\-*/\s,^sqrt().()]+$/.test(message.content);

    countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      if (!data || !data.Channel || !isNumberOrExpression) return;

      if (message.channel.id === data.Channel) {
        try {
          const replacedContent = message.content
            .replace(/\^/g, "**")
            .replace(/pow/g, "**")
            .replace(/sqrt/g, "Math.sqrt")
            .replace(/,/g, ".");
          const evaluatedNumber = eval(replacedContent);
          const enteredNumber = Math.round(evaluatedNumber);

          if (gameState.LastPerson === message.author.id && gameState.isNumberEntered) {
          
            message.react("<:downvote:1232649248869449738>");
            message.reply(`Bạn không thể nhập hai số trong một lượt, hãy chờ người khác chứ! Trò chơi sẽ bắt đầu lại từ **số 1**.`);
            gameState.Count = 1;
            gameState.isNumberEntered = false;
            gameState.LastPerson = null; 
            gameState.justReset = true; 
          
            data.Count = gameState.Count;
            data.isNumberEntered = gameState.isNumberEntered;
            data.LastPerson = gameState.LastPerson;
            await data.save();
          } else if (enteredNumber === 1 || (!gameState.justReset && enteredNumber === gameState.Count + 1)) {

            message.react("<:upvote:1232649233371234365>");
            gameState.Count = enteredNumber;
            gameState.isNumberEntered = true;
            gameState.LastPerson = message.author.id;

            data.Count = gameState.Count;
            data.isNumberEntered = gameState.isNumberEntered;
            data.LastPerson = gameState.LastPerson;
            await data.save();

            gameState.justReset = false; 
          } else {
            const nextNumber = gameState.justReset ? 1 : gameState.Count + 1;
            message.react("<:downvote:1232649248869449738>");
            message.reply(
              `Số tiếp theo là \`${nextNumber}\`, không phải \`${enteredNumber}\``
            );
            gameState.Count = 1;
            gameState.isNumberEntered = false;
          }

          data.Count = gameState.Count;
          data.LastPerson = gameState.LastPerson;
          data.isNumberEntered = gameState.isNumberEntered;

          await data.save();
        } catch (err) {
          console.error(err);
        }
      }
    });
  },
};
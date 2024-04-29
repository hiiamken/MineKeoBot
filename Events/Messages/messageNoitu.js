const countingScheme = require("../../Models/Noitu");
const RankingNoitu = require("../../Models/Rankingnoitu");
const fs = require("fs");
const path = require("path");

const dictionaryPath = path.join(__dirname, "../../tudien.txt");

let playerStates = {};
let usedWords = {};
let playerUsedWords = {};
let lastPlayerId = null;
let lastUsedWord = null;

if (!fs.existsSync(dictionaryPath)) {
  process.exit(1);
}

const vietnameseWordsData = fs
  .readFileSync(dictionaryPath, "utf-8")
  .split("\n");

const vietnameseWords = vietnameseWordsData
  .filter((wordData) => wordData.trim() !== "")
  .map((wordData) => {
    try {
      const word = JSON.parse(wordData).text.toLowerCase();
      return word;
    } catch (error) {
      return null;
    }
  })
  .filter((word) => word !== null);

module.exports = {
  name: "messageCreate",

  async execute(message) {
    try {
      let botHasPlayed = false;

      const setupData = await countingScheme.findOne({
        GuildID: message.guild.id,
      });

      if (!setupData || message.channel.id !== setupData.Channel) {
        return;
      }

      if (message.author.bot) {
        lastUsedWord = message.content.trim().toLowerCase();
        return;
      }

      const word = message.content.trim().toLowerCase();

      const emojiRegex = /<:[a-zA-Z0-9_]+:[0-9]+>/g;
      if (emojiRegex.test(word)) {
        message.delete();
        return;
      }
      if (word.split(" ").length > 2) {
        message.delete();
        return;
      }

      if (["!gg", "!dauhang", "!thua", "!reset"].includes(word)) {
        const lastWordBeforeGG = lastUsedWord.split(" ").pop();
      
        const possibleWords = vietnameseWords.filter(
          (vWord) => vWord.split(" ")[0] === lastWordBeforeGG && vWord.split(" ").length === 2
        );
      
        let selectedWords = possibleWords;
        if (possibleWords.length > 10) {
          selectedWords = [];
          for (let i = 0; i < 10; i++) {
            const randomIndex = Math.floor(Math.random() * possibleWords.length);
            selectedWords.push(possibleWords[randomIndex]);
            possibleWords.splice(randomIndex, 1);
          }
        }
      
        let possibleWordsMessage = "";
        const successMessages = [
          "Nice try! Bạn có thể sử dụng các từ sau để nối: ",
          "Gà quá, bạn có thể sử dụng các từ như ",
          "Tiếng Việt bạn kém quá, bạn có thể sử dụng các từ như "
        ];
        const failMessages = [
          "Tôi bó tay, không tìm thấy từ nào phù hợp để nối",
          "Khó quá nhỉ, tôi cũng không tìm được từ nào phù hợp",
          "Hãy bắt đầu lại với một từ dễ hơn nào!"
        ];
      
        if (selectedWords.length > 0) {
          const nextWord = "`" + selectedWords.join("`, `") + "`";
          const randomSuccessMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
          possibleWordsMessage = `${randomSuccessMessage}${nextWord}`;
        } else {
          const randomFailMessage = failMessages[Math.floor(Math.random() * failMessages.length)];
          possibleWordsMessage = randomFailMessage;
        }
      
        message.reply(possibleWordsMessage);
        message.react("<:gg:1233974572387405918>");
        playerUsedWords = {};
        lastPlayerId = null;
        botHasPlayed = false;
        return;
      }

      if (await checkValidWord(word)) {
        playerUsedWords[word] = true;
        setTimeout(async () => {
          if (botHasPlayed) {
            return;
          }

          const lastWord = word.split(" ").pop();
          const possibleWords = vietnameseWords.filter(
            (vWord) =>
              vWord.split(" ")[0] === lastWord &&
              !usedWords[vWord] &&
              vWord.split(" ").length === 2
          );

          if (possibleWords.length > 0) {
            const nextWord =
              possibleWords[Math.floor(Math.random() * possibleWords.length)];

            message.reply(nextWord);
            message.react("<:upvote:1232649233371234365>");
            usedWords[nextWord] = true;
            lastPlayerId = message.author.id;
            botHasPlayed = true;
          } else {
            message.reply(`Tôi đầu hàng.`);
            message.react("<:gg:1233974572387405918>");
            usedWords = {};
            playerUsedWords = {};
            lastPlayerId = null;
            botHasPlayed = false;
          }
        }, 1000);
      } else {
        message.reply(
          `Từ \`${word}\` không có trong từ điển, vui lòng chọn từ khác`
        );
        message.react("<:downvote:1232649248869449738>");
      }

      botHasPlayed = false;
    } catch (error) {
      console.error("Có lỗi xảy ra: ", error);
    }
  },
};

async function checkValidWord(word) {
  if (!vietnameseWords.includes(word)) {
    return false;
  }

  const words = word.split(" ");
  return words.length == 2;
}
const countingScheme = require("../../Models/Noitu");
const RankingNoitu = require("../../Models/Rankingnoitu");
const fs = require("fs");
const path = require("path");

const dictionaryPath = path.join(__dirname, "../../tudien.txt");

let playerStates = {};
let usedWords = {};
let playerUsedWords = {};
let lastPlayerId = null;

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
      const word = JSON.parse(wordData).text;
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
        return;
      }

      const word = message.content.trim();

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
        const playerUsedWordsCount = Object.keys(playerUsedWords).length;
        message.reply(`Nice try, tôi và bạn đã sử dụng tất cả ${playerUsedWordsCount} từ trong lượt này`);
        usedWords = {};
        playerUsedWords = {};
        lastPlayerId = null;
        botHasPlayed = false;
        message.react("<:gg:1233974572387405918>");
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
            const playerUsedWordsCount = Object.keys(playerUsedWords).length;
            message.reply(`Tôi đầu hàng. Bạn đã sử dụng tất cả ${playerUsedWordsCount} từ trong lượt này`);
            message.react("<:gg:1233974572387405918>");
            usedWords = {};
            playerUsedWords = {};
            lastPlayerId = null;
            botHasPlayed = false;
          }
        }, 1000);
      } else {
        message.reply(`Từ \`${word}\` không có trong từ điển, vui lòng chọn từ khác`);
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
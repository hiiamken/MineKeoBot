const countingScheme = require("../../Models/Noitu");
const RankingNoitu = require("../../Models/Rankingnoitu");
const fs = require("fs");
const path = require("path");

// Đường dẫn đến file từ điển
const dictionaryPath = path.join(__dirname, "../../tudien.txt");

// Khởi tạo các biến
let playerStates = {};
let usedWords = {};
let lastPlayerId = null;

// Kiểm tra nếu file từ điển không tồn tại
if (!fs.existsSync(dictionaryPath)) {
  console.log('File từ điển "tudien.txt" không tìm thấy.');
  process.exit(1);
}

// Đọc file từ điển và chuyển đổi thành mảng các từ
const vietnameseWordsData = fs
  .readFileSync(dictionaryPath, "utf-8")
  .split("\n");

// Lọc và chuyển đổi dữ liệu từ từ điển
const vietnameseWords = vietnameseWordsData
  .filter((wordData) => wordData.trim() !== "")
  .map((wordData) => {
    try {
      const word = JSON.parse(wordData).text;
      return word;
    } catch (error) {
      console.error(`JSON không hợp lệ: ${wordData}`);
      return null;
    }
  })
  .filter((word) => word !== null);

module.exports = {
  name: "messageCreate",

  async execute(message) {
    try {
      let botHasPlayed = false;

      // Fetch the setup data from the database
      const setupData = await countingScheme.findOne({
        GuildID: message.guild.id,
      });

      // If there is no setup data or the message is not from the setup channel, ignore it
      if (!setupData || message.channel.id !== setupData.Channel) {
        return;
      }

      // If the message is from the bot, ignore it
      if (message.author.bot) {
        return;
      }

      // Log the received message
      console.log(`Received message: ${message.content}`);

      const word = message.content.trim();

      // Check the input word
      if (await checkValidWord(word)) {
        console.log(`Word "${word}" is valid`);

        // Wait for 5 seconds
        setTimeout(async () => {
          // If the bot has already played in this turn, do nothing
          if (botHasPlayed) {
            console.log("Bot has already played in this turn");
            return;
          }

          // Find all words that start with the last word the user entered
          const lastWord = word.split(" ").pop();
          const possibleWords = vietnameseWords.filter(
            (vWord) =>
              vWord.split(" ")[0] === lastWord &&
              !usedWords[vWord] &&
              vWord.split(" ").length === 2
          );

          /// Log the possible words
          console.log("Possible words: ", possibleWords);

          if (possibleWords.length > 0) {
            // Randomly select a word
            const nextWord =
              possibleWords[Math.floor(Math.random() * possibleWords.length)];

            // Log the chosen word
            console.log("Chosen word: ", nextWord);

            // If a word is found, send it
            message.channel.send(nextWord);
            // Mark this word as used
            usedWords[nextWord] = true;
          } else {
            // If no word is found, surrender and reset the game
            message.channel.send("Tôi đầu hàng");
            usedWords = {};
            lastPlayerId = null;
            // Mark that the bot has played in this turn
            botHasPlayed = true;
          }
        }, 1000);
      } else {
        console.log(`Word "${word}" is not valid`);
        message.channel.send(`Từ \`${word}\` không có trong từ điển, vui lòng chọn từ khác`);
      }

      // When a message is received from the player, reset the bot's state
      console.log("Received message from player, resetting bot state");
      botHasPlayed = false;
    } catch (error) {
      console.error("An error occurred: ", error);
    }
  },
};

async function checkValidWord(word) {
  // Kiểm tra từ có trong danh sách từ tiếng Việt hay không
  if (!vietnameseWords.includes(word)) {
    return false;
  }

  // Kiểm tra từ có ít nhất hai từ con
  const words = word.split(" ");
  return words.length == 2;
}

async function checkMilestones(correctCount, message) {
  const milestones = [5, 10, 50, 100];
  for (const milestone of milestones) {
    if (correctCount === milestone) {
      await message.channel.send(
        `Chúc mừng <@${message.author.id}> đã đạt mốc ${milestone} lần đúng! 🎉`
      );
    }
  }
}

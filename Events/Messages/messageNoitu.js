const countingScheme = require("../../Models/Noitu");
const RankingNoitu = require("../../Models/Rankingnoitu");
const fs = require("fs");
const path = require("path");

const dictionaryPath = path.join(__dirname, "../../tudien.txt");

let playerStates = {};
let usedWords = {};
let lastPlayerId = null;

// Remove the duplicate declaration of 'lastPlayerId'
// let lastPlayerId = null;

if (fs.existsSync(dictionaryPath)) {
  console.log('The dictionary file "tudien.txt" was found.');
} else {
  console.log('The dictionary file "tudien.txt" was not found.');
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
      console.error(`Invalid JSON: ${wordData}`);
      return null;
    }
  })
  .filter((word) => word !== null);

console.log('The first 10 words in the Vietnamese word list are:', vietnameseWords.slice(0, 10));

if (vietnameseWords.includes("xin chào")) {
  console.log('"xin chào" is in the list of Vietnamese words');
} else {
  console.log('"xin chào" is not in the list of Vietnamese words');
}

if (checkValidWord("xin chào")) {
  console.log('"xin chào" is accepted by checkValidWord');
} else {
  console.log('"xin chào" is not accepted by checkValidWord');
}


module.exports = {
  name: "messageCreate",

  async execute(message) {
    const guildId = message.guild.id;
  
    if (message.author.bot) return;
  
    // Kiểm tra nếu nội dung tin nhắn là "!gg"
    if (message.content.trim().toLowerCase() === "!gg") {
      // Reset trò chơi
      usedWords = {};
      lastPlayerId = null;
      // Thông báo trò chơi đã được reset
      message.channel.send("Trò chơi đã được reset. Bắt đầu lại từ đầu!");
      return;
    }
  

    countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
      if (!data || !data.Channel) return;

      if (message.channel.id !== data.Channel) return;

      // Lấy trạng thái của người chơi
      let playerState = playerStates[message.author.id];

      if (!playerState) {
        // Nếu người chơi chưa có trạng thái, tạo mới
        playerState = {
          enteredWords: [], // Danh sách từ mà người chơi đã nhập
        };
        playerStates[message.author.id] = playerState;
      }

      const word = message.content.trim().toLowerCase();

      // Kiểm tra từ có hợp lệ trước khi xử lý tiếp
      if (!(await checkValidWord(word))) {
        message.react("<a:cerberusbap:1179405311933685880>");
        message.channel.send(
          `Từ \`${word}\` không hợp lệ, <@${message.author.id}>! Hãy nhập một từ tiếng Việt hợp lệ gồm hai chữ.`
        );
        return; // Dừng xử lý nếu từ không hợp lệ
      }

      // Kiểm tra xem từ đã được sử dụng chưa
      if (usedWords[word]) {
        message.react("<a:cerberusbap:1179405311933685880>");
        message.channel.send(
          `Từ \`${word}\` đã được sử dụng, <@${message.author.id}>! Hãy nhập một từ khác.`
        );
        return;
      }

      // Kiểm tra nếu người chơi hiện tại là người chơi cuối cùng đã nhập từ đúng
      if (message.author.id === lastPlayerId) {
        message.channel.send(
          `Bạn không thể nhập hai từ liên tiếp, <@${message.author.id}>! Hãy chờ người khác nhập từ.`
        );
        return;
      }

      // Đánh dấu từ này đã được sử dụng
      usedWords[word] = true;

      // Cập nhật ID người chơi cuối cùng đã nhập từ đúng
      lastPlayerId = message.author.id;

      message.react("<:PinkCheck:1179406997997748336>");
      playerState.enteredWords.push(word);

      const userRanking = await RankingNoitu.findOneAndUpdate(
        { userId: message.author.id },
        { $inc: { correctCount: 1 } },
        { upsert: true, new: true }
      );

      await checkMilestones(userRanking.correctCount, message);

      await data.save();
    });
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

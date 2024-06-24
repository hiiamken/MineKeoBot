const countingScheme = require("../../Models/Noitu");
const fs = require("fs");
const path = require("path");

const DICTIONARY_PATH = path.join(__dirname, "../../tudien.txt");
const MAX_SUGGESTIONS = 10;
const COMMANDS = ["!gg", "!dauhang", "!thua", "!reset"];
const SUCCESS_MESSAGES = [
  "Nice try! Bạn có thể sử dụng các từ sau để nối: ",
  "Gà quá, bạn có thể sử dụng các từ như ",
  "Tiếng Việt bạn kém quá, bạn có thể sử dụng các từ như "
];
const FAIL_MESSAGES = [
  "Tôi bó tay, không tìm thấy từ nào phù hợp để nối",
  "Khó quá nhỉ, tôi cũng không tìm được từ nào phù hợp",
  "Hãy bắt đầu lại với một từ dễ hơn nào!"
];

let usedWords = {};
let playerUsedWords = {};
let lastUsedWord = null;
let isValidLastWord = true;

const vietnameseWords = loadVietnameseWords(DICTIONARY_PATH);

function loadVietnameseWords(filePath) {
  if (!fs.existsSync(filePath)) {
    process.exit(1);
  }
  const data = fs.readFileSync(filePath, "utf-8").split("\n");
  return data
    .map(line => {
      try {
        return JSON.parse(line).text.toLowerCase();
      } catch {
        return null;
      }
    })
    .filter(word => word);
}

async function checkValidWord(word) {
  return vietnameseWords.includes(word) && word.split(" ").length === 2 && isValidLastWord;
}

function selectRandomWords(words, count) {
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateReplyForWordSelection(words) {
  if (words.length > 0) {
    const message = "`" + words.join("`, `") + "`";
    return `${SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]}${message}`;
  } else {
    return FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
  }
}

// Sửa lỗi ở đây: Đổi tên hàm để tránh xung đột
async function checkIsValidLastWord(word) {
  // Giả sử rằng mọi từ đều hợp lệ, thay thế logic này bằng logic kiểm tra thực tế của bạn
  return true;
}

// Phần còn lại của mã giữ nguyên
module.exports = {
  name: "messageCreate",

  async execute(message) {
    try {
      if (message.author.bot || !await isValidChannel(message)) return;

      const word = message.content.trim().toLowerCase();

      // Sửa lỗi: Thay đổi tên hàm sang checkIsValidLastWord
      if (!COMMANDS.includes(word) && !await checkIsValidLastWord(word)) {
        handleInvalidWord(message, word);
        return;
      }

      // Kiểm tra xem tin nhắn có nên bị bỏ qua không
      if (shouldIgnoreMessage(word)) {
        message.delete();
        return;
      }

      // Xử lý các lệnh đặc biệt
      if (COMMANDS.includes(word)) {
        handleCommand(message, word);
        return;
      }

      // Sau đó, kiểm tra từ hợp lệ
      if (await checkValidWord(word)) {
        handleValidWord(message, word);
      } else {
        handleInvalidWord(message, word);
      }
    } catch (error) {
      console.error("Có lỗi xảy ra: ", error);
    }
  },
};

async function isValidChannel(message) {
  const setupData = await countingScheme.findOne({ GuildID: message.guild.id });
  return setupData && message.channel.id === setupData.Channel;
}

function shouldIgnoreMessage(word) {
  const emojiRegex = /<:[a-zA-Z0-9_]+:[0-9]+>/g;
  return emojiRegex.test(word) || word.split(" ").length > 2;
}

function handleCommand(message, word) {
  // Kiểm tra nếu lastUsedWord là null hoặc undefined
  if (!lastUsedWord && word !== "!reset") {
    message.reply("Chưa có từ nào được sử dụng.");
    return;
  }

  // Xử lý các lệnh
  switch (word) {
    case "!reset":
      resetGameState();
      message.reply("Trò chơi đã được đặt lại.");
      break;
    default:
      const lastWordBeforeGG = lastUsedWord.split(" ").pop();
      const possibleWords = vietnameseWords.filter(vWord => vWord.startsWith(lastWordBeforeGG) && !usedWords[vWord] && vWord.split(" ").length === 2);
      const selectedWords = selectRandomWords(possibleWords, MAX_SUGGESTIONS);
      message.reply(generateReplyForWordSelection(selectedWords));
      break;
  }
}

function handleValidWord(message, word) {
  const words = word.split(" ");
  if (words.length === 2 && words[0] === words[1]) {
    message.reply("Không được sử dụng từ láy toàn bộ 👎");
    isValidLastWord = false;
    return;
  }

  playerUsedWords[word] = true;
  lastUsedWord = word; // Cập nhật lastUsedWord khi từ hợp lệ
  isValidLastWord = true;
  setTimeout(() => replyWithBotWord(message, word), 1000);
}

function handleInvalidWord(message, word) {
  message.reply(`Từ \`${word}\` không có trong từ điển, vui lòng chọn từ khác`);
  isValidLastWord = false;
}

function replyWithBotWord(message, word) {
  const lastWord = word.split(" ").pop();
  const possibleWords = vietnameseWords.filter(vWord => vWord.startsWith(lastWord) && !usedWords[vWord] && vWord.split(" ").length === 2);
  if (possibleWords.length > 0) {
    const nextWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
    message.reply(nextWord);
    usedWords[nextWord] = true;
    lastUsedWord = nextWord; // Cập nhật lastUsedWord với từ của bot
  } else {
    message.reply("Tôi đầu hàng.");
    resetGameState();
  }
}

function resetGameState() {
  usedWords = {};
  playerUsedWords = {};
  lastUsedWord = null;
  isValidLastWord = true;
}
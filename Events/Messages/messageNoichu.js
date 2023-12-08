const countingScheme = require("../../Models/Noichu");
const RankingNoichu = require("../../Models/Rankingnoichu");
const axios = require("axios");

// Thêm API key và endpoint của WordsAPI
const apiKey = 'c0ac70d184msh79be5892d876e19p161670jsnc017900fd346';
const apiEndpoint = 'https://wordsapiv1.p.rapidapi.com/words/';

// Sử dụng một đối tượng để lưu trữ trạng thái cho từng người chơi và từng từ
const playerStates = {};
const usedWords = {};

module.exports = {
    name: "messageCreate",

    async execute(message) {
        const guildId = message.guild.id;

        if (message.author.bot) return;

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

            if (!(await checkValidWord(word))) {
                message.react("<a:cerberusbap:1179405311933685880>");
                message.channel.send(`Từ \`${word}\` không hợp lệ, <@${message.author.id}>! Hãy nhập một từ tiếng Anh hợp lệ.`);
                await data.save();
                return;
            }

            // Kiểm tra xem từ đã được sử dụng chưa
            if (playerState.enteredWords.includes(word)) {
                message.react("<a:cerberusbap:1179405311933685880>");
                message.channel.send(`Từ \`${word}\` đã được sử dụng, <@${message.author.id}>! Bạn chỉ có thể nhập từ có chung đầu hoặc chung cuối với từ trước đó.`);
                await data.save();
                return;
            }

            message.react("<:PinkCheck:1179406997997748336>");
            playerState.enteredWords.push(word);

            const userRanking = await RankingNoichu.findOneAndUpdate(
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
    // Kiểm tra từ có chứa ký tự đặc biệt hay không
    if (/[^a-zA-Z]/.test(word)) {
        return false;
    }

    return isValidWordInDictionary(word);
}

const fs = require('fs');

// Đọc whitelist từ file JSON
const whitelistPath = './whitelistnoichu.json';
let whitelist;

try {
    const whitelistData = fs.readFileSync(whitelistPath);
    whitelist = JSON.parse(whitelistData);
} catch (error) {
    console.error('Error reading whitelist:', error);
    whitelist = { whitelist: [] };
}

async function isValidWordInWhitelist(word) {
    // Kiểm tra xem từ có trong whitelist hay không
    return whitelist.whitelist.includes(word);
}

async function isValidWordInDictionary(word) {
    const apiUrl = `${apiEndpoint}${word}`;
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
                'X-RapidAPI-Key': apiKey,
            },
        });

        console.log('API response:', response.data);

        const hasDefinition = response.data && response.data.results && response.data.results.length > 0 && response.data.results[0].definition;

        // Kiểm tra xem từ có trong whitelist hay không
        const isInWhitelist = await isValidWordInWhitelist(word);

        // Trả về true nếu có definition hoặc từ nằm trong whitelist
        return hasDefinition || isInWhitelist;
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function checkMilestones(correctCount, message) {
    const milestones = [5, 10, 50, 100];
    for (const milestone of milestones) {
        if (correctCount === milestone) {
            await message.channel.send(`Chúc mừng <@${message.author.id}> đã đạt mốc ${milestone} lần đúng! 🎉`);
        }
    }
}

const countingScheme = require("../../Models/Counting");
const Ranking = require("../../Models/Ranking");
const math = require("mathjs");

module.exports = {
    name: "messageCreate",

    async execute(message) {
        const guildId = message.guild.id;

        if (message.author.bot) return;

        // Updated regex to better capture expressions with parentheses and exponentiation
        const isMathExpression = /^[\d\(\)\^]+(\s*[\+\-\*\/\^]\s*[\d\(\)\^]+)*$/.test(message.content);

        countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
            if (!data || !data.Channel || !isMathExpression) return;

            if (message.channel.id === data.Channel) {
                if (!data.isNumberEntered) {
                    try {
                        if (data.LastPerson === message.author.id) {
                            // Người chơi đã nhập số trong lượt hiện tại
                            // Thêm react ❌
                            message.react("<a:cerberusbap:1179405311933685880>");

                            // Gửi thông báo mới
                            message.channel.send(`Bạn đã chơi không đúng luật, <@${message.author.id}>! Bạn chỉ có thể nhập một số trong cùng một lượt chơi`);

                            // Reset lại trò chơi
                            data.Count = 1;
                            data.isNumberEntered = false;
                            data.LastPerson = "";
                        } else {
                            // Tạo một hàm xử lý dấu '^'
                            const processExponentiation = (expr) => {
                                return expr.replace(/\^/g, (match, offset, str) => {
                                    const prevChar = str[offset - 1];
                                    const nextChar = str[offset + 1];

                                    if (prevChar === ')' && nextChar === '(') {
                                        // Nếu có '^' giữa hai dấu ngoặc, thì thay thế bằng '**'
                                        return '**';
                                    } else {
                                        // Ngược lại, giữ nguyên '^'
                                        return match;
                                    }
                                });
                            };

                            // Áp dụng hàm xử lý cho biểu thức
                            const processedExpression = processExponentiation(message.content);

                            const result = math.evaluate(processedExpression);

                            // Kiểm tra nếu kết quả là số hợp lệ (finite và là số nguyên)
                            if (!isNaN(result) && isFinite(result) && result === Math.floor(result)) {
                                if (result === data.Count) {
                                    message.react("<:PinkCheck:1179406997997748336>");
                                    data.Count++;
                                    data.isNumberEntered = true;
                                } else if (result === 100 && data.Count === 100) {
                                    message.react("💯");
                                    data.Count = 1;
                                    data.isNumberEntered = false;
                                } else {
                                    // Thêm react ❌
                                    message.react("<a:cerberusbap:1179405311933685880>");

                                    // Gửi thông báo mới
                                    message.channel.send(`Đã phá hỏng chuỗi ở số **${data.Count}**! Bắt đầu lại từ số: \`1\` `);

                                    // Reset lại trò chơi
                                    data.Count = 1;
                                    data.isNumberEntered = true; // Đặt thành true khi số đã được nhập
                                }

                                const userRanking = await Ranking.findOne({ userId: message.author.id });

                                if (userRanking) {
                                    userRanking.correctCount++;
                                } else {
                                    await Ranking.create({ userId: message.author.id, correctCount: 1 });
                                }

                                data.LastPerson = message.author.id;
                            } else {
                                // Nếu kết quả không hợp lệ, thông báo và không tăng Count
                                message.react("<a:cerberusbap:1179405311933685880>");
                                message.channel.send(`Kết quả \`${result}\` không hợp lệ, <@${message.author.id}>! Hãy nhập một phép tính hợp lệ.`);

                                // Reset lại trò chơi
                                data.Count = 1;
                                data.isNumberEntered = true; // Đặt thành true khi số đã được nhập
                                data.LastPerson = "";
                            }
                        }
                    } catch (error) {
                        console.error(error);
                    } finally {
                        // Save data after processing
                        await data.save(); // Lưu dữ liệu sau mỗi lượt chơi
                    }
                } else {
                    // Người chơi đã nhập số trong lượt hiện tại
                    // Thêm react ❌
                    message.react("<a:cerberusbap:1179405311933685880>");

                    // Gửi thông báo mới
                    message.channel.send(`Bạn đã chơi không đúng luật, <@${message.author.id}>! Bạn chỉ có thể nhập một số trong cùng một lượt chơi`);
                }
            }
        });
    },
};

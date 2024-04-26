const countingScheme = require("../../Models/Counting");
const Ranking = require("../../Models/Ranking");

module.exports = {
  name: "messageCreate",

  async execute(message) {
    const guildId = message.guild.id;

    if (message.author.bot) return;

    // Kiểm tra xem nội dung tin nhắn có phải là số hoặc biểu thức toán học không
    const isNumberOrExpression = /^[\d+\-*/\s,^sqrt().]+$/.test(
      message.content
    );

    countingScheme.findOne({ GuildID: guildId }, async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      if (!data || !data.Channel || !isNumberOrExpression) return;

      if (message.channel.id === data.Channel) {
        try {
          // Thay thế "^" bằng "**", "pow" và "sqrt" bằng các toán tử tương ứng của JavaScript
          const replacedContent = message.content
            .replace(/\^/g, "**")
            .replace(/pow/g, "**")
            .replace(/sqrt/g, "Math.sqrt")
            .replace(/,/g, ".");
          const evaluatedNumber = eval(replacedContent);
          const enteredNumber = Math.round(evaluatedNumber);

          if (data.LastPerson === message.author.id) {
            message.react("<:downvote:1232649248869449738>");
            message.reply(
              `Bạn không thể nhập hai số trong một lượt, hãy chờ người khác chứ! Trò chơi sẽ bắt đầu lại từ **số 1**.`
            );
            data.Count = 1;
            data.isNumberEntered = false;
            data.LastPerson = "";
          } else if (enteredNumber === 1 || enteredNumber === data.Count + 1) {
            // Nếu số được nhập là số tiếp theo trong chuỗi, cập nhật dữ liệu
            message.react("<:upvote:1232649233371234365>");
            data.Count = enteredNumber;
            data.isNumberEntered = true;
            data.LastPerson = message.author.id;
          } else {
            // Nếu số được nhập không phải là số tiếp theo trong chuỗi, reset trò chơi
            const nextNumber = data.Count + 1;
            message.react("<:upvote:1232649233371234365>");
            message.reply(
              `Số tiếp theo là ${nextNumber}, không phải ${enteredNumber}`
            );
            data.Count = 1;
            data.isNumberEntered = false;
            data.LastPerson = "";
          }
        
          await data.save();
        } catch (err) {
          console.error(err);
        }
      }
    });
  },
};
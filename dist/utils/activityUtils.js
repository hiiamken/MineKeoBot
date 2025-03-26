"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRandomActivity = setRandomActivity;
const discord_js_1 = require("discord.js");
// Danh sách hoạt động hài hước
const activities = [
    { name: "nghĩ về tương lai 🤯", type: discord_js_1.ActivityType.Watching },
    { name: "MV mới của Jack", type: discord_js_1.ActivityType.Watching },
    { name: "phát hiện bug nhưng không sửa 🤡", type: discord_js_1.ActivityType.Watching },
    { name: "cãi nhau với KeoGPT 🤖", type: discord_js_1.ActivityType.Competing },
    { name: "kế hoạch thống trị thế giới 🧠", type: discord_js_1.ActivityType.Watching },
    { name: "nhạc Lofi để chill ☕", type: discord_js_1.ActivityType.Listening },
    { name: "cách làm giàu bằng tài xỉu", type: discord_js_1.ActivityType.Watching },
    { name: "cách hack MineKeo 🕵️‍♂️", type: discord_js_1.ActivityType.Watching },
    { name: "test bug nhưng không sửa 🔥", type: discord_js_1.ActivityType.Playing },
    { name: "nạp tiền cho taoo", type: discord_js_1.ActivityType.Playing },
    { name: "chạy deadline cùng TKen", type: discord_js_1.ActivityType.Competing },
    { name: "chờ ai đó ping mình... ⏳", type: discord_js_1.ActivityType.Watching },
    { name: "cày rank nhưng toàn thua 😭", type: discord_js_1.ActivityType.Playing },
    { name: "bỏ việc đi ngủ 😴", type: discord_js_1.ActivityType.Watching },
];
// Hàm cập nhật trạng thái bot với activity ngẫu nhiên
function setRandomActivity(client) {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    client.user?.setPresence({ activities: [activity], status: "online" });
}

import { ActivityType, Client } from 'discord.js';

// Danh sách hoạt động hài hước
const activities = [
  { name: "nghĩ về tương lai 🤯", type: ActivityType.Watching },
  { name: "MV mới của Jack", type: ActivityType.Watching },
  { name: "phát hiện bug nhưng không sửa 🤡", type: ActivityType.Watching },
  { name: "cãi nhau với KeoGPT 🤖", type: ActivityType.Competing },
  { name: "kế hoạch thống trị thế giới 🧠", type: ActivityType.Watching },
  { name: "nhạc Lofi để chill ☕", type: ActivityType.Listening },
  { name: "cách làm giàu bằng tài xỉu", type: ActivityType.Watching },
  { name: "cách hack MineKeo 🕵️‍♂️", type: ActivityType.Watching },
  { name: "test bug nhưng không sửa 🔥", type: ActivityType.Playing },
  { name: "nạp tiền cho taoo", type: ActivityType.Playing },
  { name: "chạy deadline cùng TKen", type: ActivityType.Competing },
  { name: "chờ ai đó ping mình... ⏳", type: ActivityType.Watching },
  { name: "cày rank nhưng toàn thua 😭", type: ActivityType.Playing },
  { name: "bỏ việc đi ngủ 😴", type: ActivityType.Watching },
];

// Hàm cập nhật trạng thái bot với activity ngẫu nhiên
function setRandomActivity(client: Client) {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    client.user?.setPresence({ activities: [activity], status: "online" });
  }
  
  export { setRandomActivity };

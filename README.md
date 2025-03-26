<p align="center">
  <a href="https://github.com/hiiamken/MineKeoBot">
    <img src="https://capsule-render.vercel.app/api?type=waving&height=300&color=gradient&text=MineKeoBot&fontSize=65&fontAlign=50&fontAlignY=30&animation=fadeIn&textBg=false&reversal=true&section=header" alt="MineKeoBot Banner"/>
  </a>
</p>

<h1 align="center">MineKeoBot: Discord Security & Utility Bot</h1>

<p align="center">
  MineKeoBot là một bot Discord toàn năng, chuyên cung cấp các tính năng bảo vệ server (Anti-Nuke, Anti-Raid, Panic Mode), tự động backup & restore dữ liệu, hệ thống xác minh thành viên, và nhiều tiện ích khác.
  <br />
  <a href="https://github.com/hiiamken/MineKeoBot/issues">🐞 Báo cáo lỗi / 💡 Đề xuất tính năng</a>
</p>

---

## 🌟 Giới Thiệu

**MineKeoBot** được phát triển nhằm mục đích bảo vệ và nâng cao trải nghiệm quản trị trên Discord. Với nhiều tính năng ưu việt như Anti-Nuke, Anti-Raid, tự động backup & rollback, hệ thống verify (captcha, reaction role) và nhiều tính năng tiện ích khác, MineKeoBot giúp:
  
- **Bảo vệ server** khỏi hành vi phá hoại, spam và raid.
- **Tự động backup** cấu hình server, cho phép khôi phục nhanh khi có sự cố.
- **Hệ thống xác minh** thành viên thông minh, đảm bảo chỉ người thật được truy cập.
- **Reaction Role** tiện lợi với chế độ “unique” nâng cao cho phép chuyển đổi role mượt mà.
- Và nhiều tính năng tiện ích khác hỗ trợ quản trị và tăng cường sự tương tác.

---

## 🔥 Tính Năng Nổi Bật

- **Anti-Nuke & Anti-Raid:**  
  Phát hiện hành vi phá hoại, tính điểm risk (risk score) và tự động cách ly hoặc kích hoạt Panic Mode nếu cần, giúp bảo vệ server khỏi các cuộc tấn công đột xuất.
  
- **Panic Mode & Rollback:**  
  Khi Panic Mode kích hoạt, bot tự động tạo snapshot backup, freeze các thành viên nghi ngờ và cho phép admin rollback nhanh chóng nếu có sự cố.

- **Tự động Backup & Restore:**  
  Backup dữ liệu server định kỳ, lưu trữ file JSON, tính checksum để đảm bảo tính toàn vẹn và hỗ trợ rollback toàn bộ hoặc từng phần.

- **Hệ thống Verify:**  
  Sử dụng captcha (theo hình ảnh động) hoặc qua hội thoại trong DM để xác minh thành viên, giúp lọc bot và spammer.

- **Reaction Role:**  
  Tạo embed đăng ký role qua reaction với chế độ “normal” hoặc “unique”, cho phép người dùng nhận role dễ dàng, chuyển đổi role mượt mà và lưu dữ liệu Reaction Role lâu dài qua database.

- **Hỗ trợ đa ngôn ngữ và nhiều tiện ích quản trị:**  
  Bao gồm các lệnh như `/ask`, `/reply`, `/stats`, `/ranking-gpt`, và nhiều lệnh admin để quản lý dữ liệu và cấu hình server.

---

## 🙋‍♂️ Từ Nhà Phát Triển

Chào mừng bạn đến với MineKeoBot! Tôi là **TKen**, người phát triển bot này, ban đầu được tạo ra cho MineKeo Network Minecraft server. Tôi rất vui khi chia sẻ bot này cho cộng đồng Discord rộng rãi. Mọi ý kiến đóng góp, báo cáo lỗi và đề xuất tính năng đều được hoan nghênh qua [Discord MineKeo Network](https://discord.gg/minekeo).

---

## 🚀 Hướng Dẫn Sử Dụng

### 🔥 Lệnh Chính

| Lệnh                  | Mô tả                                                                                           | Prefix (nếu có) |
| --------------------- | ------------------------------------------------------------------------------------------------ | --------------- |
| `/ask`                | Đặt câu hỏi, có thể kèm hình ảnh; bot tạo thread mới cho cuộc trò chuyện.                        | `!ask`         |
| `/reply`              | Tiếp tục cuộc trò chuyện trong thread hiện tại.                                                 | `!reply`       |
| `/verify`             | Xác minh thành viên qua captcha trong DM để lọc bot và spam.                                     | -              |
| `/reactionrole`       | Tạo embed đăng ký nhận role qua reaction với giao diện hội thoại (không dùng modal).              | -              |
| `/backup`             | Quản lý backup dữ liệu server (tạo, danh sách, tải, xoá, tự động backup).                        | -              |
| `/restore`            | Khôi phục dữ liệu server từ backup (có yêu cầu phê duyệt nếu cần).                                | -              |
| `/antiraid`           | Tích hợp các lệnh chống raid, báo cáo và xử lý hành vi tấn công trên server.                      | -              |
| `/antinuke`           | Tích hợp các lệnh chống nuke, báo cáo và xử lý hành vi phá hoại server.                           | -              |

*Các lệnh admin và lệnh khác được liệt kê trong phần tài liệu riêng.*

---

## 🛠️ Cài Đặt

### 📋 Yêu Cầu

- [Node.js](https://nodejs.org) (phiên bản 18 trở lên được khuyến nghị)
- Discord Bot Token (từ [Discord Developer Portal](https://discord.com/developers/applications))
- API Key của OpenAI & Google Gemini (nếu dùng các tính năng AI)
- MySQL (cho production) hoặc SQLite (cho local)
- Các quyền truy cập phù hợp (đảm bảo role của bot ở vị trí cao nhất)

### 🔧 Các Bước Cài Đặt

1. **Clone Repository:**

    ```bash
    git clone https://github.com/hiiamken/MineKeoBot.git
    cd MineKeoBot
    ```

2. **Cài Đặt Dependencies:**

    ```bash
    npm install
    ```

3. **Cấu Hình Environment:**

    - Tạo file `.env` bằng cách sao chép từ `.env.example`.
    - Cập nhật các biến môi trường:
      - `DISCORD_TOKEN`
      - `OPENAI_API_KEY`
      - `GOOGLE_API_KEY`
      - `CLIENT_ID`, `GUILD_ID`, `ADMIN_USER_ID`,…
      - Các thông tin cấu hình database nếu dùng MySQL.

4. **Cấu Hình File Config:**

    - Nếu có file `config.ts` hoặc `securityConfig.ts`, chỉnh sửa sao cho phù hợp.
    - Nếu file chứa thông tin nhạy cảm, hãy chuyển sang `.env` và tạo file mẫu `config.example.ts`.

5. **Deploy Slash Commands:**

    ```bash
    node deploy-commands.js
    ```

6. **Khởi Chạy Bot:**

    ```bash
    node bot.js
    ```

---

## 🔗 Liên Kết Nhanh

- [Node.js](https://nodejs.org/)
- [Discord.js](https://discord.js.org/)
- [OpenAI Platform](https://platform.openai.com/)
- [Google Gemini](https://ai.google.dev/)
- [MySQL](https://www.mysql.com/)
- [SQLite](https://www.sqlite.org/)

---

## 🤝 Đóng Góp

Các đóng góp, báo cáo lỗi, và đề xuất tính năng đều được hoan nghênh. Vui lòng gửi Pull Request hoặc mở Issue trên [GitHub repository](https://github.com/hiiamken/MineKeoBot).

---

## 📜 License

Dự án này được cấp phép theo [MIT License](LICENSE).

---

<p align="center">
  <a href="https://github.com/hiiamken/MineKeoBot/stargazers">
    <img src="https://img.shields.io/github/stars/hiiamken/MineKeoBot?style=social" alt="GitHub stars">
  </a>
  <a href="https://github.com/hiiamken/MineKeoBot/fork">
    <img src="https://img.shields.io/github/forks/hiiamken/MineKeoBot?style=social" alt="GitHub forks">
  </a>
  <a href="https://github.com/hiiamken/MineKeoBot/issues">
    <img src="https://img.shields.io/github/issues/hiiamken/MineKeoBot?color=important" alt="GitHub issues">
  </a>
  <a href="https://github.com/hiiamken/MineKeoBot/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/hiiamken/MineKeoBot" alt="License">
  </a>
</p>

<p align="center">
  Được xây dựng với ❤️ bởi <a href="https://github.com/hiiamken">TKen</a>.
</p>

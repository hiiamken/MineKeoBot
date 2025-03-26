<p align="center">
  <a href="https://github.com/hiiamken/MineKeoBot">
    <img src="https://capsule-render.vercel.app/api?type=waving&height=300&color=gradient&text=MineKeoBot&fontSize=65&fontAlign=50&fontAlignY=30&animation=fadeIn&textBg=false&reversal=true&section=header" alt="MineKeoBot Banner"/>
  </a>
</p>

<h1 align="center">MineKeoBot: The Ultimate Discord Security & Utility Bot</h1>

<p align="center">
  MineKeoBot is a comprehensive, all-in-one Discord bot engineered to secure and streamline your server. With advanced anti-abuse systems, automated backup & restore, verification, and dynamic reaction roles, MineKeoBot delivers unparalleled protection and utility for modern communities.
  <br />
  <a href="https://github.com/hiiamken/MineKeoBot/issues">🐞 Report Bugs / 💡 Request Features</a>
</p>

---

## 📖 Overview

**MineKeoBot** is built with cutting-edge technologies using Node.js and Discord.js. Originally designed for the MineKeo Network Minecraft server, it has evolved into a robust solution for:
  
- **Server Security**: Prevent malicious actions (Anti-Nuke, Anti-Raid) and automatically initiate lockdowns & rollbacks.
- **Data Integrity**: Regularly backup server configurations and provide rapid restoration in case of emergencies.
- **Member Verification**: Ensure only legitimate members gain access with a custom, hassle-free verification system.
- **Dynamic Reaction Roles**: Easily assign roles through reactions—with support for both multiple and unique role selections.
- **Utility & Moderation**: An array of moderation commands and community engagement tools to keep your server thriving.

---

## ⚡ Key Features

- **Anti-Nuke & Anti-Raid**  
  Detect and counteract mass-delete attacks and spam, preserving your server’s integrity.
  
- **Panic Mode & Automated Rollback**  
  When under attack, trigger Panic Mode to freeze actions, capture rapid backups, and rollback to a safe state with a single command.

- **Scheduled & On-Demand Backups**  
  Seamlessly back up your server’s roles, channels, permissions, and messages using SQLite for reliable, local data persistence.

- **Intuitive Member Verification**  
  Reduce spam and bot intrusion with a user-friendly, DM-based verification process powered by captcha challenges.

- **Custom Reaction Roles**  
  Create interactive embed messages that allow users to claim or remove roles via reactions. Choose between “normal” (multiple roles) and “unique” (only one role at a time) modes.

- **Comprehensive Moderation Tools**  
  A suite of admin commands for kick, ban, mute, and more, paired with detailed logs for audit and rollback capabilities.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- A **Discord Bot Token** from the [Discord Developer Portal](https://discord.com/developers/applications)
- **SQLite** (default database for local and lightweight production environments)
- Appropriate bot permissions (ensure the bot's role is placed at the top)

### Installation

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/hiiamken/MineKeoBot.git
    cd MineKeoBot
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Set Up Environment Variables:**

    - Create a `.env` file by copying `.env.example`.
    - Update the necessary variables:
      - `DISCORD_TOKEN`: Your Discord bot token.
      - `CLIENT_ID`, `GUILD_ID`, `ADMIN_USER_ID`, etc.
      - Other configuration variables as needed.

4. **Configure Bot Settings:**

    - Adjust settings in your configuration files (e.g., `securityConfig.ts`, `config.ts`) to suit your server's needs.
    - Ensure sensitive data is stored in the `.env` file and not committed publicly.

5. **Deploy Slash Commands:**

    ```bash
    node deploy-commands.js
    ```

6. **Start the Bot:**

    ```bash
    node bot.js
    ```

---

## 📚 Usage

MineKeoBot comes with a host of commands to manage your server. Here are some examples:

- **/verify**  
  Initiate member verification through a DM-based captcha challenge.

- **/reactionrole**  
  Set up interactive reaction roles to let members self-assign roles easily.

- **/backup** & **/restore**  
  Create and manage backups of your server’s configuration, with options for scheduled or manual restoration.

- **/antinuke** & **/antiraid**  
  Protect your server by detecting and counteracting mass actions or raids automatically.

For a full list of commands and their usage, refer to the command documentation within the bot or type `/help` in Discord.

---

## 🔗 Quick Links

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord.js Documentation](https://discord.js.org/)
- [Node.js](https://nodejs.org/)
- [SQLite](https://www.sqlite.org/index.html)

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are always welcome!  
Please open an issue or submit a pull request on the [GitHub repository](https://github.com/hiiamken/MineKeoBot).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

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
  Built with ❤️ by <a href="https://github.com/hiiamken">TKen</a>.
</p>

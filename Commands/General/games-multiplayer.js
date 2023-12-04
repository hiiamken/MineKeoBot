const {
    Client,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} = require("discord.js");
const {
    Connect4,
    RockPaperScissors,
    TicTacToe,
} = require('discord-gamecord');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("games-multiplayer")
        .setDescription("Chơi một trò chơi nhiều người chơi trong máy chủ.")
        .addStringOption(option =>
            option.setName("game")
                .setDescription("*Chọn một trò chơi để chơi.")
                .setRequired(true)
                .addChoices(
                    { name: "Connect-4", value: "connect4" },
                    { name: "Oẳn tù tì", value: "rps" },
                    { name: "Tic-Tac-Toe", value: "tictactoe" },
                )
        )
        .addUserOption(option =>
            option.setName("user")
                .setDescription('*Chọn đối thủ của bạn cho trò chơi.')
                .setRequired(true)
        )
        .setDMPermission(false),
    /**
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {

        const allowedChannelId = '1181147913703936021';

        if (interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            const channelMention = `<#${allowedChannel.id}>`;

            return interaction.reply({
                content: `Bạn chỉ có thể sử dụng lệnh này trong ${channelMention}.`,
                ephemeral: true,
            });
        }

        const game = interaction.options.getString("game");
        const user = interaction.options.getUser("user");

        if (!user) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xECB2FB)
                        .setDescription(":warning: | Đối tượng được chỉ định có khả năng đã rời khỏi máy chủ.")
                ],
                ephemeral: true
            })
        }

        if (user.bot) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xECB2FB)
                        .setDescription(":warning: | Bạn không được phép chơi với một bot.")
                ],
                ephemeral: true
            })
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xECB2FB)
                        .setDescription(":warning: | Bạn không thể chơi trò chơi với chính mình.")
                ],
                ephemeral: true
            })
        }

        switch (game) {
            case "connect4": {
                const Game = new Connect4({
                    message: interaction,
                    slash_command: true,
                    opponent: interaction.options.getUser('user'),
                    embed: {
                        title: 'Trò chơi Connect4',
                        statusTitle: 'Trạng thái',
                        color: '#2f3136'
                    },
                    emojis: {
                        board: '⚪',
                        player1: '🔴',
                        player2: '🟡'
                    },
                    mentionUser: true,
                    timeoutTime: 60000,
                    buttonStyle: 'PRIMARY',
                    turnMessage: '{emoji} | Lượt của người chơi **{player}**.',
                    winMessage: '{emoji} | **{player}** đã chiến thắng trò chơi Connect4.',
                    tieMessage: 'Trò chơi hòa! Không ai chiến thắng trò chơi!',
                    timeoutMessage: 'Trò chơi không hoàn thành! Không ai chiến thắng trò chơi!',
                    playerOnlyMessage: 'Chỉ có thể sử dụng nút này cho {player} và {opponent}.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
            case "rps": {
                const Game = new RockPaperScissors({
                    message: interaction,
                    slash_command: true,
                    opponent: interaction.options.getUser('user'),
                    embed: {
                        title: 'Oẳn tù tì',
                        color: '#2f3136',
                        description: 'Nhấn vào một nút bên dưới để chọn.'
                    },
                    buttons: {
                        rock: 'Đá',
                        paper: 'Giấy',
                        scissors: 'Kéo'
                    },
                    emojis: {
                        rock: '🌑',
                        paper: '📰',
                        scissors: '✂️'
                    },
                    mentionUser: true,
                    timeoutTime: 60000,
                    buttonStyle: 'PRIMARY',
                    pickMessage: 'Bạn chọn {emoji}.',
                    winMessage: '**{player}** đã chiến thắng {opponent}! Chúc mừng!',
                    tieMessage: 'Trò chơi hòa! Không ai chiến thắng trò chơi!',
                    timeoutMessage: 'Trò chơi không hoàn thành! Không ai chiến thắng trò chơi!',
                    playerOnlyMessage: 'Chỉ có thể sử dụng nút này cho {player} và {opponent}.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
            case "tictactoe": {
                const Game = new TicTacToe({
                    message: interaction,
                    slash_command: true,
                    opponent: interaction.options.getUser('user'),
                    embed: {
                        title: 'Tic Tac Toe',
                        color: '#2f3136',
                        statusTitle: 'Trạng thái',
                        overTitle: 'Trò chơi kết thúc'
                    },
                    emojis: {
                        xButton: '❌',
                        oButton: '🔵',
                        blankButton: '➖'
                    },
                    mentionUser: true,
                    timeoutTime: 60000,
                    xButtonStyle: 'DANGER',
                    oButtonStyle: 'PRIMARY',
                    turnMessage: '{emoji} | Lượt của người chơi **{player}**.',
                    winMessage: '{emoji} | **{player}** đã chiến thắng trò chơi TicTacToe.',
                    tieMessage: 'Trò chơi hòa! Không ai chiến thắng trò chơi!',
                    timeoutMessage: 'Trò chơi không hoàn thành! Không ai chiến thắng trò chơi!',
                    playerOnlyMessage: 'Chỉ có thể sử dụng nút này cho {player} và {opponent}.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                })
            }
                break;
        }
    }
}

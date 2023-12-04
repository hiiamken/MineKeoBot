const {
    Client,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");
const {
    TwoZeroFourEight,
    FastType,
    FindEmoji,
    Flood,
    GuessThePokemon,
    Hangman,
    MatchPairs,
    Minesweeper,
    Slots,
    Snake,
    Trivia,
    Wordle,
    WouldYouRather
} = require('discord-gamecord');
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("games-singleplayer")
        .setDescription("Chơi một trò chơi đơn trong máy chủ.")
        .addStringOption(option =>
            option.setName("game")
                .setDescription("*Chọn một trò chơi để chơi.")
                .setRequired(true)
                .addChoices(
                    { name: "2048", value: "2048" },
                    { name: "Chat nhanh", value: "fasttype" },
                    { name: "Tìm Emoji", value: "findemoji" },
                    { name: "Flood", value: "flood" },
                    { name: "Đoán tên Pokemon", value: "guessthepokemon" },
                    { name: "Người treo cổ", value: "hangman" },
                    { name: "Ghép cặp", value: "matchpairs" },
                    { name: "Dò mìn", value: "minesweeper" },
                    { name: "Oẳn tù tì", value: "rps" },
                    { name: "Slots", value: "slots" },
                    { name: "Snake", value: "snake" },
                )
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

        switch (game) {
            case "2048": {
                const Game = new TwoZeroFourEight({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: '2048',
                        color: '#2f3136'
                    },
                    emojis: {
                        up: '⬆️',
                        down: '⬇️',
                        left: '⬅️',
                        right: '➡️',
                    },
                    timeoutTime: 60000,
                    buttonStyle: 'PRIMARY',
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                    if (result.result === 'lose') {
                        interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff0000')  // Màu đỏ
                                    .setTitle('2048 - Game Over')
                                    .setDescription(`:cry: Bạn đã thua cuộc! Điểm của bạn là ${result.score}.`)
                            ],
                            components: []  // Xóa các thành phần (nút) nếu có
                        });
                    }
                });
            }
                break;
            case "fasttype": {
                const Game = new FastType({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Chat nhanh',
                        color: '0xECB2FB',
                        description: 'Bạn có {time} giây để gõ câu sau đây.'
                    },
                    timeoutTime: 60000,
                    sentence: 'Một câu rất hay để gõ nhanh.',
                    winMessage: 'Bạn đã thắng! Bạn đã hoàn thành đua gõ trong {time} giây với tốc độ {wpm} từ mỗi phút.',
                    loseMessage: 'Bạn đã thua! Bạn không gõ đúng câu trong thời gian cho phép.',
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                    if (result.result === 'lose') {
                        interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xECB2FB)  // Màu đỏ
                                    .setTitle('Chat nhanh - Game Over')
                                    .setDescription(`:cry: Bạn đã thua cuộc!`)
                            ],
                            components: []  // Xóa các thành phần (nút) nếu có
                        });
                    }
                });
            }
                break;
            case "findemoji": {
                const Game = new FindEmoji({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Tìm Emoji',
                        color: '#2f3136',
                        description: 'Nhớ các biểu tượng cảm xúc từ bảng dưới đây.',
                        findDescription: 'Tìm biểu tượng {emoji} trước khi hết thời gian.'
                    },
                    timeoutTime: 60000,
                    hideEmojiTime: 5000,
                    buttonStyle: 'PRIMARY',
                    emojis: ['🍉', '🍇', '🍊', '🍋', '🥭', '🍎', '🍏', '🥝'],
                    winMessage: 'Chiến thắng! Bạn đã chọn đúng biểu tượng. {emoji}',
                    loseMessage: 'Thua cuộc! Bạn đã chọn sai biểu tượng. {emoji}',
                    timeoutMessage: 'Thua cuộc! Bạn đã hết thời gian. Biểu tượng là {emoji}',
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                    if (result.result === 'lose') {
                        interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xECB2FB)  // Màu đỏ
                                    .setTitle('Tìm Emoji - Game Over')
                                    .setDescription(`:cry: Bạn đã thua cuộc!`)
                            ],
                            components: []  // Xóa các thành phần (nút) nếu có
                        });
                    }
                });
            }
                break;
            case "flood": {
                const Game = new Flood({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Flood',
                        color: '#2f3136',
                    },
                    difficulty: 13,
                    timeoutTime: 60000,
                    buttonStyle: 'PRIMARY',
                    emojis: ['🟥', '🟦', '🟧', '🟪', '🟩'],
                    winMessage: 'Bạn đã thắng! Bạn đã thực hiện **{turns}** lượt.',
                    loseMessage: 'Bạn đã thua! Bạn đã thực hiện **{turns}** lượt.',
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
            case "guessthepokemon": {
                const Game = new GuessThePokemon({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Đoán tên\ Pokemon',
                        color: '#2f3136'
                    },
                    timeoutTime: 15000,
                    winMessage: 'Bạn đã đoán đúng! Đó là một con {pokemon}.',
                    loseMessage: 'Chúc may mắn lần sau! Đó là một con {pokemon}.',
                    errMessage: 'Không thể lấy dữ liệu pokemon! Vui lòng thử lại.',
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
                case "hangman": {
                    const themes = [
                        "thiên nhiên",
                        "thể thao",
                        "màu sắc",
                        "cắm trại",
                        "trái cây",
                        "discord",
                        "mùa đông",
                        "pokemon"
                    ];
                
                    const chosenTheme = themes[Math.floor(Math.random() * themes.length)];
                
                    // Define themeWords based on the chosen theme
                    let themeWords;
                    switch (chosenTheme) {
                        case "thiên nhiên":
                            themeWords = ["tree", "flower", "river", "mountain"];
                            break;
                        // Add more cases for other themes as needed
                
                        default:
                            themeWords = ["default", "fallback", "words"];
                            break;
                    }
                
                    // Check if themeWords is defined and not empty
                    if (!themeWords || themeWords.length === 0) {
                        console.error(`Error: themeWords is undefined or empty for theme '${chosenTheme}'.`);
                        // Handle the error appropriately, e.g., provide a default word list
                        themeWords = ["default", "fallback", "words"];
                    }
                
                    const Game = new Hangman({
                        message: interaction,
                        slash_command: true,
                        embed: {
                            title: 'Người treo cổ',
                            color: '0xECB2FB',
                        },
                        hangman: { hat: '🎩', head: '😟', shirt: '👕', pants: '🩳', boots: '👞👞' },
                        timeoutTime: 60000,
                        theme: chosenTheme,
                        themeWords: themeWords, // Pass the themeWords array
                        winMessage: 'Bạn đã thắng! Đáp án là **{word}**.',
                        loseMessage: 'Bạn đã thua! Đáp án là **{word}**.',
                        playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                    });
                
                    Game.startGame();
                    Game.on('gameOver', result => {
                        console.log(result);  // =>  { result... }
                    });
                }
                break;
            case "matchpairs": {
                const Game = new MatchPairs({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Ghép cặp',
                        color: '#2f3136',
                        description: '**Nhấp vào các nút để kết hợp biểu tượng với nhau.**'
                    },
                    timeoutTime: 60000,
                    emojis: ['🍉', '🍇', '🍊', '🥭', '🍎', '🍏', '🥝', '🥥', '🍓', '🫐', '🍍', '🥕', '🥔'],
                    winMessage: '**Bạn đã thắng trò chơi! Bạn đã lật tổng cộng `{tilesTurned}` ô.**',
                    loseMessage: '**Bạn đã thua trò chơi! Bạn đã lật tổng cộng `{tilesTurned}` ô.**',
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
            case "minesweeper": {
                const Game = new Minesweeper({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Dò mìn',
                        color: '#2f3136',
                        description: 'Nhấp vào các nút để mở các ô trừ bom.'
                    },
                    emojis: { flag: '🚩', mine: '💣' },
                    mines: 5,
                    timeoutTime: 60000,
                    winMessage: 'Bạn đã thắng trò chơi! Bạn đã tránh thành công tất cả bom.',
                    loseMessage: 'Bạn đã thua trò chơi! Hãy chú ý đến bom lần sau.',
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
            case "rps": {
                let choices = ["rock", "paper", "scissor"]
                const botchoice = `${choices[(Math.floor(Math.random() * choices.length))]}`
                console.log(`Bot đã chọn ${botchoice}`)

                const Embed = new EmbedBuilder()
                    .setColor(0xECB2FB)
                    .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                    .setDescription(`<@${interaction.member.id}> hãy chọn động tác của bạn.`)

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("rock")
                        .setLabel("Đấm")
                        .setEmoji(`✊`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("paper")
                        .setLabel("Giấy")
                        .setEmoji(`✋`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("scissor")
                        .setLabel("Kéo")
                        .setEmoji(`✌`),
                )

                const Page = await interaction.reply({
                    embeds: [Embed],
                    components: [row]
                })
                const col = Page.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: ms("10s")
                })
                col.on("collect", i => {

                    switch (i.customId) {

                        case "rock": {

                            if (botchoice == "rock") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Hòa\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Đá", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Đá", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }

                            if (botchoice == "paper") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Bạn đã thua trò chơi\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Đá", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Giấy", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }
                            if (botchoice == "scissor") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Bạn đã thắng trò chơi\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Đá", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Kéo", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }
                        }
                            break;
                        case "paper": {
                            if (botchoice == "rock") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Bạn đã thắng trò chơi\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Giấy", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Đá", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }

                            if (botchoice == "paper") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Hòa\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Giấy", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Giấy", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }
                            if (botchoice == "scissor") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Bạn đã thua trò chơi\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Giấy", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Kéo", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }
                        }
                            break;

                        case "scissor": {

                            if (botchoice == "rock") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Bạn đã thua trò chơi\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Kéo", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Đá", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }

                            if (botchoice == "paper") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Bạn đã thắng trò chơi\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Kéo", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Giấy", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }
                            if (botchoice == "scissor") {

                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xECB2FB)
                                            .setAuthor({ name: "Trò chơi Oẳn tù tì", iconURL: interaction.member.displayAvatarURL() })
                                            .setDescription(`\`\`\`Hòa\`\`\``)
                                            .addFields(
                                                { name: "Lựa chọn của bạn", value: "Kéo", inline: true },
                                                { name: "Lựa chọn của tôi", value: "Kéo", inline: true }
                                            )
                                    ],
                                    components: []
                                })
                            }
                        }
                            break;
                    }
                })
                col.on("end", (collected) => {

                    if (collected.size > 0) return

                    interaction.editReply({
                        embeds: [
                            Embed.setDescription(`:warning: | Bạn không chọn nước đi của mình.`).setColor("0x2f3136")
                        ],
                        components: []
                    })
                })
            }
                break;
            case "slots": {
                const Game = new Slots({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Máy đánh bạc',
                        color: '#2f3136'
                    },
                    slots: ['🍇', '🍊', '🍋', '🍌']
                });

                Game.startGame();
                Game.on('gameOver', result => {
                    console.log(result);  // =>  { result... }
                });
            }
                break;
            case "snake": {
                const Game = new Snake({
                    message: interaction,
                    slash_command: true,
                    embed: {
                        title: 'Trò chơi Rắn',
                        overTitle: 'Game Over',
                        color: '#2f3136'
                    },
                    emojis: {
                        board: '⬛',
                        food: '🍎',
                        up: '⬆️',
                        down: '⬇️',
                        left: '⬅️',
                        right: '➡️',
                    },
                    stopButton: 'Dừng',
                    timeoutTime: 60000,
                    snake: { head: '🟢', body: '🟩', tail: '🟢', over: '💀' },
                    foods: ['🍎', '🍇', '🍊', '🫐', '🥕', '🥝', '🌽'],
                    playerOnlyMessage: 'Chỉ {player} mới có thể sử dụng các nút này.'
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
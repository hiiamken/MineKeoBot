const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Hiển thị một meme bất kì!")
        .addStringOption(option =>
            option.setName("platform")
                .setDescription("Nền tàng (tuỳ chọn)")
                .addChoices(
                    { name: "Reddit", value: "reddit" },
                    { name: "Giphy", value: "giphy" }
                )
        ),

    async execute(interaction) {
        const { guild, options, member } = interaction;

        const platform = options.getString("platform");

        const embed = new EmbedBuilder();

        async function redditMeme() {
            try {
                const res = await fetch('https://www.reddit.com/r/memes/random/.json');
                const redditDataList = await res.json();
        
                // Check if the necessary properties exist in the first element of the array
                if (
                    redditDataList &&
                    redditDataList[0] &&
                    redditDataList[0].data &&
                    redditDataList[0].data.children &&
                    redditDataList[0].data.children[0] &&
                    redditDataList[0].data.children[0].data &&
                    redditDataList[0].data.children[0].data.title &&
                    redditDataList[0].data.children[0].data.url &&
                    redditDataList[0].data.children[0].data.author
                ) {
                    const title = redditDataList[0].data.children[0].data.title;
                    const url = redditDataList[0].data.children[0].data.url;
                    const author = redditDataList[0].data.children[0].data.author;
        
                    return interaction.reply({
                        embeds: [embed.setTitle(title).setImage(url).setURL(url).setColor("Random").setFooter({ text: author })],
                    });
                } else {
                    console.error("Unexpected Reddit API response structure:", redditDataList);
                    return interaction.reply("An error occurred while fetching the meme. Please try again.");
                }
            } catch (error) {
                console.error("Error fetching Reddit meme:", error);
                return interaction.reply("An error occurred while fetching the meme. Please try again.");
            }
        }
        

        async function giphyMeme() {
            try {
                const res = await fetch('https://api.giphy.com/v1/gifs/random?api_key=aCFmTC3ewXbGTq0jqvFDsz2RfE6fDc0d&tag=&rating=g');
                const meme = await res.json();

                // Check if the necessary properties exist
                if (meme && meme.data && meme.data.title && meme.data.images && meme.data.images.original && meme.data.images.original.url && meme.data.user && meme.data.user.display_name && meme.data.user.avatar_url) {
                    const title = meme.data.title;
                    const url = meme.data.images.original.url;
                    const link = meme.data.url;
                    const author = meme.data.user.display_name;
                    const pf = meme.data.user.avatar_url;

                    return interaction.reply({
                        embeds: [embed.setTitle(`${title}`).setImage(`${url}`).setURL(link).setColor("Random").setFooter({ text: author, iconURL: pf })],
                    });
                } else {
                    console.error("Unexpected Giphy API response structure:", meme);
                    return interaction.reply("An error occurred while fetching the meme. Please try again.");
                }
            } catch (error) {
                console.error("Error fetching Giphy meme:", error);
                return interaction.reply("An error occurred while fetching the meme. Please try again.");
            }
        }

        if (platform === "reddit") {
            redditMeme();
        }

        if (platform === "giphy") {
            giphyMeme();
        }

        if (!platform) {
            let memes = [giphyMeme, redditMeme];
            memes[Math.floor(Math.random() * memes.length)]();
        }
    }
}

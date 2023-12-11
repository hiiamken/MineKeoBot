const { ComponentType, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Hiển thị tất cả các lệnh của bot MineKeo."),
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

        const emojis = {
            info: "📜",
            moderation: "🛠️",
            general: "⚙️",
            images: "🎞",
            levels: "📶",
        };

        const directories = new Set(interaction.client.commands.map((cmd) => cmd.folder));

        const formatString = (str) =>
            `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;

        const categories = Array.from(directories).map((dir) => {
            const getCommands = interaction.client.commands.filter((cmd) => cmd.folder === dir).map((cmd) => {
                return {
                    name: cmd.data.name,
                    description: cmd.data.description || "Không có chú thích cho lệnh này.",
                };
            });

            return {
                directory: formatString(dir),
                commands: getCommands,
            };
        });

        const embed = new EmbedBuilder()
            .setDescription("Chọn danh sách lệnh muốn xem")
            .setColor(0xECB2FB); // Set embed color to 0xECB2FB

        const descriptions = {
            info: "Các lệnh cho người mới.",
            moderation: "Các lệnh chỉ STAFF được dùng.",
            general: "Cách lệnh tất cả mọi người có thể dùng.",
            images: "Các lệnh tạo hình ảnh",
            levels: "Các lệnh về cấp",
        };

        const logoURL = 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1';

        const components = (state) => [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("help-menu")
                    .setPlaceholder("Vui lòng lựa chọn chủ đề")
                    .setDisabled(state)
                    .addOptions(
                        categories.map((cmd) => {
                            return {
                                label: cmd.directory,
                                value: cmd.directory.toLowerCase(),
                                description: descriptions[cmd.directory.toLowerCase()] || `Các lệnh của chủ đề ${cmd.directory}.`,
                                emoji: emojis[cmd.directory.toLowerCase() || null],
                            };
                        })
                    )
            ),
        ];

        const initialMessage = await interaction.reply({
            embeds: [embed],
            components: components(false),
            ephemeral: true,
        });

        const filter = (interaction) => interaction.user.id === interaction.member.id;

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.SelectMenu,
        });

        collector.on("collect", async (interaction) => {
            const [directory] = interaction.values;
            const category = categories.find(
                (x) => x.directory.toLowerCase() === directory
            );

            const categoryEmbed = new EmbedBuilder()
                .setAuthor({name: `Các lệnh ${formatString(directory)}`, iconURL: logoURL})
                .setDescription(descriptions[directory.toLowerCase()] || `Các lệnh của chủ đề ${formatString(directory)}.`)
                .addFields(
                    category.commands.map((cmd) => {
                        return {
                            name: `\`${cmd.name}\``,
                            value: cmd.description,
                            inline: true,
                        };
                    })
                )
                .setColor(0xECB2FB); // Set embed color to 0xECB2FB

            try {
                await interaction.update({ embeds: [categoryEmbed] });
            } catch (error) {
                console.error(error);
                // Handle the error, log it, or take appropriate action
            }
        });

        collector.on("end", () => {
            if (interaction.channel.messages.cache.has(initialMessage.id)) {
                initialMessage.edit({ components: components(true) });
            }
        });
    },
};

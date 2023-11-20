const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

// Số người chơi trên mỗi trang
const playersPerPage = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("listbans")
        .setDescription("Liệt kê những người chơi bị ban.")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const { guild } = interaction;

        try {
            // Lấy danh sách người chơi bị ban
            const bans = await guild.bans.fetch();

            // Tạo danh sách để lưu thông tin bans
            const banList = bans.map(banInfo => {
                return {
                    username: banInfo.user.username,
                    userId: banInfo.user.id,
                    reason: banInfo.reason || "Không có lý do",
                    bannedAt: banInfo.user.createdAt, // Thời điểm bị ban
                };
            });

            // Tính toán số trang cần hiển thị
            const totalPages = Math.ceil(banList.length / playersPerPage);

            // Lấy số trang từ thông báo (nếu có)
            let page = interaction.options.getInteger("page") || 1;

            // Đảm bảo trang nằm trong khoảng từ 1 đến totalPages
            page = Math.max(1, Math.min(totalPages, page));

            // Tính chỉ mục bắt đầu và kết thúc của danh sách ban cho trang hiện tại
            const startIndex = (page - 1) * playersPerPage;
            const endIndex = startIndex + playersPerPage;

            // Tạo danh sách bans cho trang hiện tại
            const currentPageBans = banList.slice(startIndex, endIndex);

            // Tạo embed để hiển thị danh sách bans cho trang hiện tại
            const embed = new EmbedBuilder()
                .setTitle(`Danh sách người chơi bị ban (Trang ${page}/${totalPages})`)
                .setColor(0xECB2FB)
                .setDescription(currentPageBans.map((ban, index) => {
                    const formattedDate = ban.bannedAt.toLocaleString(); // Format thời gian

                    return `**${startIndex + index + 1}.** ${ban.username} (ID: **${ban.userId}**) - **Lý do:** ${ban.reason} - **Bị ban vào lúc:** ${formattedDate}`;
                }).join('\n'))
                .setTimestamp();

            // Tạo nút "Previous Page"
            const prevButton = new ButtonBuilder()
                .setCustomId('prevPage')
                .setLabel('Trang trước')
                .setStyle(ButtonStyle.Primary);

            // Tạo nút "Next Page"
            const nextButton = new ButtonBuilder()
                .setCustomId('nextPage')
                .setLabel('Trang sau')
                .setStyle(ButtonStyle.Primary);

            // Tạo Action Row chứa các nút
            const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

            // Gửi embed và action row
            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true,
            });

            // Lắng nghe sự kiện button click
            const filter = i => i.customId === 'prevPage' || i.customId === 'nextPage';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                // Xử lý sự kiện khi nút được bấm
                if (i.customId === 'prevPage') {
                    page = Math.max(1, page - 1);
                } else if (i.customId === 'nextPage') {
                    page = Math.min(totalPages, page + 1);
                }

                // Lấy chỉ mục bắt đầu và kết thúc mới cho danh sách ban
                const newStartIndex = (page - 1) * playersPerPage;
                const newEndIndex = newStartIndex + playersPerPage;

                // Tạo danh sách bans cho trang mới
                const newPageBans = banList.slice(newStartIndex, newEndIndex);

                // Tạo embed mới cho trang mới
                const newEmbed = new EmbedBuilder()
                    .setTitle(`Danh sách người chơi bị ban (Trang ${page}/${totalPages})`)
                    .setColor(0xECB2FB)
                    .setDescription(newPageBans.map((ban, index) => {
                        const formattedDate = ban.bannedAt.toLocaleString(); // Format thời gian

                        return `**${newStartIndex + index + 1}.** ${ban.username} (ID: ${ban.userId}) - **ID:** ${ban.userId} - **Lý do:** ${ban.reason} - **Bị ban vào lúc:** ${formattedDate}`;
                    }).join('\n'))
                    .setTimestamp();

                // Update message với embed và action row mới
                await i.update({
                    embeds: [newEmbed],
                    components: [row],
                });
            });

            // Lắng nghe sự kiện button end
            collector.on('end', collected => {
                if (collected.size === 0) {
                    // Kết thúc sự kiện sau khi hết thời gian
                    row.components.forEach(component => component.setDisabled(true));
                    interaction.editReply({ components: [row] });
                }
            });

        } catch (err) {
            console.error(err);

            const errEmbed = new EmbedBuilder()
                .setDescription(`Không thể lấy danh sách người chơi bị ban.`)
                .setColor(0xECB2FB);
            interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }
    },
};

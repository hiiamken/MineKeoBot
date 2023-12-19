const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../Models/Giveaway'); // Update with the correct path
// Đây là hàm generateRandomCode được tích hợp trực tiếp
function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

 
module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Quản lý sự kiện tặng quà')
        .addSubcommand(subcommand =>
            subcommand.setName('start')
                .setDescription('Bắt đầu một sự kiện Giveaway mới')
                .addStringOption(option => option.setName('duration').setDescription('Thời lượng của sự kiện tính bằng phút').setRequired(true))
                .addStringOption(option => option.setName('prize').setDescription('Giải thưởng của sự kiện').setRequired(true))
                .addIntegerOption(option => option.setName('winners').setDescription('Số người chiến thắng').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('Kênh đăng thông báo sự kiện').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('end')
                .setDescription('Kết thúc một sự kiện Giveaway')
                .addStringOption(option => option.setName('giveaway_id').setDescription('ID của sự kiện').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reroll')
                .setDescription('Quay lại người thẳng')
                .addStringOption(option => option.setName('giveaway_id').setDescription('ID của sự kiện').setRequired(true))
                .addIntegerOption(option => option.setName('winners').setDescription('Số người chiến thắng').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('edit')
                .setDescription('Chỉnh sửa một sự kiện Giveawy')
                .addStringOption(option => option.setName('giveaway_id').setDescription('ID của sự kiện').setRequired(true))
                .addStringOption(option => option.setName('duration').setDescription('Thời lượng của sự kiện tính bằng phút'))
                .addStringOption(option => option.setName('prize').setDescription('Phần thưởng mới'))
                .addIntegerOption(option => option.setName('winners').setDescription('Số người chiến thắng'))
                .addChannelOption(option => option.setName('channel').setDescription('Kênh mới đăng thông báo sự kiện'))
        ),
 
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
 
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await interaction.reply({
                content: "Bạn không được dùng lệnh này. Thiếu quyền: ManageMembers",
                ephemeral: true
            })
        } else {
            switch (subcommand) {
                case 'start':
                    await startGiveaway(interaction, client);
                    break;
                case 'end':
                    await endGiveaway(interaction, client);
                    break;
                case 'reroll':
                    await rerollGiveaway(interaction, client);
                    break;
                case 'edit':
                    await editGiveaway(interaction, client);
                    break;
                default:
                    await interaction.reply({ content: 'Lệnh phụ không hợp lệ', ephemeral: true });
            }
        }
    }
};
async function startGiveaway(interaction, client) {
    const duration = parseInt(interaction.options.getString('duration')) * 60000; // Duration in minutes to milliseconds
    const prizex = interaction.options.getString('prize');
    const winnersCountX = interaction.options.getInteger('winners');
    const channel = interaction.options.getChannel('channel');
 
    const endTimeX = new Date(Date.now() + duration);
 
    const code = generateRandomCode(10)
 
    const embed = new EmbedBuilder()
        .setTitle("🎉 Giveaway 🎉")
        .setDescription(`Phần thưởng: ${prizex}\nKết thúc sau: ${duration / 60000} phút \nSố lượng giải: ${winnersCountX}`)
        .setFooter({ text: `ID: ${code}` })
        .setColor(0x00FFFF);
 
    const sentMessage = await channel.send({ embeds: [embed], components: [] });
 
    await Giveaway.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: sentMessage.id,
        endTime: endTimeX,
        prize: prizex,
        winnersCount: winnersCountX,
        participants: [],
        id: code,
        ended: false
    });
 
    const joinButton = new ButtonBuilder()
        .setCustomId(`giveaway-join-${code}`)
        .setLabel('Tham gia Giveaway')
        .setStyle(ButtonStyle.Primary);
 
    const actionRow = new ActionRowBuilder().addComponents(joinButton);
 
    await sentMessage.edit({ components: [actionRow] })
 
    await interaction.reply({ content: 'Giveaway đã bắt đầu!', ephemeral: true });
}
 
 
async function endGiveaway(interaction, client) {
    const giveawayId = interaction.options.getString('giveaway_id');
    const giveaway = await Giveaway.findOne({id: giveawayId});
 
    if (!giveaway) {
        return interaction.reply({ content: "ID không hợp lệ.", ephemeral: true });
    }
 
    // Select winners
    const winners = selectWinners(giveaway.participants, giveaway.winnersCount);
    const winnersText = winners.map(winner => `<@${winner}>`).join(', ');
    const announcement = `🎉 Giveaway đã kết thúc! Chúc mừng: ${winnersText}`;
 
    // Fetch the giveaway message
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);
 
        const embed = new EmbedBuilder({ description: "ENDED" })
        await message.edit({ embeds: [embed], components: [] }); // Remove buttons
 
        // Announce the winners in the same channel
        await channel.send(announcement);
    } catch (error) {
        console.error("Lỗi khi kết thúc Giveaway:", error);
        return interaction.reply({ content: "Có mỗi lỗi đã xảy ra.", ephemeral: true });
    }
 
    // Update the giveaway as ended in the database
    giveaway.ended = true;
    await giveaway.save();
 
    await interaction.reply({ content: "Kết thúc Giveaway thành công.", ephemeral: true });
}
 
function selectWinners(participants, count) {
    // Shuffle array and pick 'count' winners
    let shuffled = participants.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
 
 
 
async function rerollGiveaway(interaction, client) {
    const giveawayId = interaction.options.getString('giveaway_id');
    const newWinnersCount = interaction.options.getInteger('winners');
 
    const giveaway = await Giveaway.findOne({id: giveawayId});
    if (!giveaway) {
        return interaction.reply({ content: 'ID không hợp lệ.', ephemeral: true });
    }
 
    const newWinners = selectWinners(giveaway.participants, newWinnersCount);
    const winnersText = newWinners.map(winner => `<@${winner}>`).join(', ');
    const announcement = `🎉 Người chiến thắng mới: ${winnersText}!`;
 
    const channel = await client.channels.fetch(giveaway.channelId);
    await channel.send(announcement);
 
    await interaction.reply({ content: 'Quay lại Giveaway!', ephemeral: true });
}
 
 
 
async function editGiveaway(interaction, client) {
    const giveawayId = interaction.options.getString('giveaway_id');
    const newDuration = interaction.options.getString('duration');
    const newPrize = interaction.options.getString('prize');
    const newWinnersCount = interaction.options.getInteger('winners');
    const newChannel = interaction.options.getChannel('channel');
 
    const giveaway = await Giveaway.findOne({id: giveawayId});
    if (!giveaway) {
        return interaction.reply({ content: 'ID không hợp lệ.', ephemeral: true });
    }
 
    // Calculate new end time if duration is provided
    let newEndTime;
    if (newDuration) {
        newEndTime = new Date(Date.now() + parseInt(newDuration) * 60000);
    }
 
    // Update giveaway in the database
    await Giveaway.findOneAndUpdate({ 
        id: giveawayId,
        $set: {
            endTime: newEndTime || giveaway.endTime,
            prize: newPrize || giveaway.prize,
            winnersCount: newWinnersCount || giveaway.winnersCount,
            channelId: newChannel?.id || giveaway.channelId
        }
    });
 
    // Edit the original giveaway message to reflect changes
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    if (message) {
        const embedx = new EmbedBuilder({
            title: `${newPrize || giveaway.prize}`,
            description: `Kết thúc sau: ${newEndTime || giveaway.endTime} \nSố giải thưởng: ${newWinnersCount || giveaway.winnersCount}`,
        })
 
        await message.edit({ embeds: [embedx] });
    }
 
    await interaction.reply({ content: 'Giveaway đã được thay đổi!', ephemeral: true });
}
 
 
 
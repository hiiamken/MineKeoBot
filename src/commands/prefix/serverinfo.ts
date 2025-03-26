import { Message, EmbedBuilder, TextChannel } from 'discord.js';

export const serverInfoCommand = {
    name: 'serverinfo',
    description: 'Xem thông tin chi tiết của máy chủ',
    async execute(message: Message) {
        if (!message.guild) return;
        
        const { guild } = message;
        const owner = await guild.fetchOwner();
        const boostLevel = guild.premiumTier;
        const boosterCount = guild.premiumSubscriptionCount || 0;

        // Lấy số lượng user và bot chính xác
        const members = await guild.members.fetch();
        const botCount = members.filter(member => member.user.bot).size;
        const humanCount = members.size - botCount;

        const embed = new EmbedBuilder()
        .setColor('#DEA2DD')
        .setTitle('📑 | Thông tin máy chủ')
        .setThumbnail(guild.iconURL({ size: 1024 }) || '')
        .addFields(
            { name: '🆔 | ID', value: `> ${guild.id}`, inline: true },
            { name: '📌 | Tên', value: `> ${guild.name}`, inline: true },
            { name: '👑 | Chủ sở hữu', value: `> <@${owner.id}>`, inline: true },
            { name: '📊 | Thống kê kênh', value: `> **Văn bản:** ${guild.channels.cache.filter(c => c.type === 0).size}\n> **Thoại:** ${guild.channels.cache.filter(c => c.type === 2).size}\n> **Danh mục:** ${guild.channels.cache.filter(c => c.type === 4).size}`, inline: true },
            { name: '👥 | Thành viên', value: `> **Tổng:** ${guild.memberCount}\n> **Người dùng:** ${humanCount}\n> **Bot:** ${botCount}`, inline: true },
            { name: '🎉 | Cấp độ', value: `> **Cấp độ:** ${boostLevel} ||(${boosterCount} nâng cấp)||`, inline: false },
            { name: '📅 | Ngày tạo', value: `> ${guild.createdAt.toLocaleDateString()} ${guild.createdAt.toLocaleTimeString()}`, inline: false }
        )
        .setFooter({ text: 'MineKeo Network' })
        .setTimestamp();

        const channel = message.channel as TextChannel;
        channel.send({ embeds: [embed] });
    },
};

export default serverInfoCommand;

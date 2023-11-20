const { EmbedBuilder } = require("@discordjs/builders");
const { GuildMember } = require("discord.js");

module.exports = {
    name: "guildMemberAdd",
    execute(member) {
        const { user, guild } = member;
        const welcomeChannel = member.guild.channels.cache.get('1132107457892712449');
        const gioithieu = '1122041534288764958';
        const nhanrole = '1106803900322951169';
        const hoidap = '1167855017848487947';
        const memberRole = '1121769384646561843';

        // Kiểm tra nếu member có id trước khi sử dụng nó trong chuỗi
        const welcomeMessage = "Hi vọng cậu sẽ có những trải nghiệm đáng nhớ tại MineKeo NetWork!";

        const welcomeEmbed = new EmbedBuilder()
            .setAuthor({ name: `Chào cậu, ${member.displayName}!`, iconURL: 'https://cdn.discordapp.com/attachments/1174937441556238396/1174941493660766218/logo_1500x1500.png?ex=65696c89&is=6556f789&hm=ea7a182a97eb4d2f81b82060e96d3934462b2efb8b8c25c901ff57903847c8d1' })
            .setDescription(welcomeMessage)
            .setColor(0xECB2FB)
            .addFields(
                { name: 'IP PC', value: 'minekeo.com', inline: true },
                { name: 'IP PE', value: 'pe.minekeo.com', inline: true },
                { name: 'Thông tin máy chủ:', value: `<#${gioithieu}>` },
                { name: 'Nhận role các cụm đang chơi:', value: `<#${nhanrole}>` }, // Thêm trường mới cho ID của kênh
                { name: 'Các câu hỏi thường gặp:', value: `<#${hoidap}>` }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({
                text: `Bạn là người thứ ${guild.memberCount} trong máy chủ!`,
                iconURL: 'https://cdn.discordapp.com/attachments/1174937441556238396/1174954169367547924/png-transparent-emoji-wink-hello-icon.png?ex=65697857&is=65570357&hm=9ebe56bec652f5a2195ed0c4a33d7d4b44160c2df4689f58a729cad90f5bb7b6&'
            });

        welcomeChannel.send({ embeds: [welcomeEmbed] });
        member.roles.add(memberRole);
    }
}

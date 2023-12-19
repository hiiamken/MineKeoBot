const {
    SlashCommandBuilder,
    ChannelType,
    EmbedBuilder,
    PermissionsBitField,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("afk")
        .setDescription(`Lệnh AFK`)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start")
                .setDescription("Bắt đầu trạng thái AFK")
                .addStringOption((option) =>
                    option
                        .setName("reason")
                        .setRequired(false)
                        .setDescription(`Nhập lý do bạn muốn AFK`)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
            .setName("end")
            .setDescription("Kết thúc trạng thái AFK của bạn")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("exempt")
                .setDescription("Thêm ngoại lệ cho các ping AFK")
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setRequired(false)
                        .setDescription(`Vai trò được bỏ qua`)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setRequired(false)
                        .setDescription(`Kênh được bỏ qua`)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("exempt-remove")
                .setDescription("Gỡ bỏ một ngoại lệ cho các ping AFK")
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setRequired(false)
                        .setDescription(`Vai trò được bỏ qua`)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setRequired(false)
                        .setDescription(`Kênh được bỏ qua`)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("force-remove")
                .setDescription("Gỡ bỏ trạng thái AFK cho người dùng khác")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setRequired(true)
                        .setDescription(
                            `Người dùng cần gỡ bỏ trạng thái AFK`
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Lấy tất cả thông tin về ai đang AFK và các kênh, vai trò bỏ qua trong trạng thái AFK của bạn")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("warning")
                .setDescription("Thêm một kênh cảnh báo cho các ping AFK")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setRequired(true)
                        .setDescription(
                            `Kênh cảnh báo khi có ping người dùng AFK`
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove-warning")
                .setDescription("Gỡ bỏ cảnh báo cho các ping AFK")
        ),
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
        
        const command = interaction.options.getSubcommand();
        await interaction.guild.autoModerationRules.fetch()
        const rule = await interaction.guild.autoModerationRules.cache.find(x => x.name === 'AFK mention block')
        switch (command) {
            case "start":
                {
                    const reason =
                        interaction.options.getString("reason") ?? "Lý do không rõ";

                    if (!rule) {
                        const keywords = [`<@1>`, `<@${interaction.user.id}>`]
                        await interaction.guild.autoModerationRules.create({
                            name: "AFK mention block",
                            enabled: true,
                            eventType: 1,
                            triggerType: 1,
                            triggerMetadata: {
                                keywordFilter: keywords,
                            },
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        customMessage:
                                            "Người dùng này hiện đang AFK, tôi đã chặn tin nhắn này để tránh làm phiền họ",
                                    },
                                },
                            ],
                        });
                    } else {
                        if (rule.triggerMetadata.keywordFilter.includes(`<@${interaction.user.id}>`)) {
                            return interaction.reply(
                                `Bạn đã ở trong trạng thái AFK, để kết thúc hãy thử \`/afk end\``
                            );
                        }
                        const keywords = await rule.triggerMetadata.keywordFilter
                        keywords.push(`<@${interaction.user.id}>`)
                        rule.edit({
                            triggerMetadata: {
                                keywordFilter: keywords,
                            },
                        });
                    }
                    try {
                        const nickname = interaction.member.nickname || interaction.user.displayname || interaction.user.username
                        if (nickname.length < 27) {
                            const name = `[AFK] ${nickname}`
                            await interaction.member.setNickname(name)
                        }
                        interaction.reply(`Đã ghi nhận, tất cả các mention sẽ bị chặn, trừ các ping vai trò.
Đối với người dùng khác, ${interaction.user.username} đang AFK vì: ${reason}`);
                    }
                    catch (error) {
                        await interaction.reply(`Đã ghi nhận, tất cả các mention sẽ bị chặn, trừ các ping vai trò.
Đối với người dùng khác, ${interaction.user.username} đang AFK vì: ${reason}`)
                        interaction.followUp({ content: `Không thể thay đổi biệt danh của bạn, có vẻ như không có quyền cần thiết để làm điều đó.`, ephemeral: true })
                    }

                }
                break;
 
            case "end":
                {
                    if (!rule || !rule.triggerMetadata.keywordFilter.includes(`<@${interaction.user.id}>`)) {
                        return interaction.reply(
                            `Bạn không đang AFK, để bắt đầu hãy thử \`/afk start\``
                        );
                    }
 
                    let keywords = await rule.triggerMetadata.keywordFilter
                    keywords = keywords.filter(words => words !== `<@${interaction.user.id}>`)
                    rule.edit({
                        triggerMetadata: {
                            keywordFilter: keywords,
                        },
                    });
                    const name = interaction.member.nickname || interaction.user.displayname || interaction.user.username
                    if (name.startsWith('[AFK]')) {
                        const newname = name.slice(6)
                        await interaction.member.setNickname(newname)
                    }
                    interaction.reply(`<@${interaction.user.id}> đã trở lại`);
                }
                break;
 
            case "exempt":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `Bạn không có quyền cần thiết để làm điều này`, ephemeral: true })
                    }
                    if (!rule) {
                        return interaction.reply(
                            "Không có quy tắc AFK, hãy thử tạo một quy tắc trước khi thay đổi quyền, để làm hãy thử `/AFK start`. Sau đó, bạn có thể gỡ bỏ mình khỏi trạng thái AFK"
                        );
                    }
 
                    const channel = interaction.options.getChannel("channel");
                    const role = interaction.options.getRole("role");
                    if (role || channel) {
                        let exemptroles = Array.from(rule.exemptRoles.keys())
                        let exemptchannels = Array.from(rule.exemptChannels.keys())
                        console.log(exemptroles)
                        if (role && !exemptroles.includes(role.id)) {
                            exemptroles.push(role.id)
                        }
                        if (channel && !exemptchannels.includes(channel.id)) {
                            if (channel.type !== ChannelType.GuildText) {
                                return interaction.reply(
                                    "Vui lòng nhập một kênh văn bản hiện có"
                                );
                            }
                            exemptchannels.push(channel.id);
                        }
                        rule.edit({
                            exemptRoles: exemptroles,
                            exemptChannels: exemptchannels,
                        });
                    } else {
                        return interaction.reply(
                           "Vui lòng nhập một vai trò hoặc kênh hợp lệ để bỏ qua. Chú ý chỉ chấp nhận các kênh văn bản"
                        );
                    }
                    interaction.reply("Quy tắc AFK của máy chủ đã được cập nhật");
                }
                break;
 
            case "exempt-remove":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `Bạn không có quyền cần thiết để làm điều này`, ephemeral: true })
                    }
                    if (!rule) {
                        return interaction.reply(
                            "Không có quy tắc AFK, hãy thử tạo một quy tắc trước khi thay đổi quyền, để làm hãy thử `/AFK start`. Sau đó, bạn có thể gỡ bỏ mình khỏi trạng thái AFK"
                        );
                    }
                    const channel = interaction.options.getChannel("channel");
                    const role = interaction.options.getRole("role");
                    if (role || channel) {
                        let exemptroles = Array.from(rule.exemptRoles.keys())
                        let exemptchannels = Array.from(rule.exemptChannels.keys())
                        console.log(exemptroles)
                        if (role && exemptroles.includes(role.id)) {
                            exemptroles = keywords.filter(words => words !== `${role.id}`)
                        }
                        if (channel && exemptchannels.includes(channel.id)) {
                            if (channel.type !== ChannelType.GuildText) {
                                return interaction.reply(
                                    "Vui lòng nhập một kênh văn bản hiện có"
                                );
                            }
                            exemptchannels = keywords.filter(words => words !== `${channel.id}`)
                        }
                        rule.edit({
                            exemptRoles: exemptroles,
                            exemptChannels: exemptchannels,
                        });
                    } else {
                        return interaction.reply(
                            "Vui lòng nhập một vai trò hoặc kênh hợp lệ để bỏ qua. Chú ý chỉ chấp nhận các kênh văn bản"
                        );
                    }
                    interaction.reply("Quy tắc AFK của máy chủ đã được cập nhật");
                }
                break;
            case "force-remove":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `Bạn không có quyền cần thiết để làm điều này`, ephemeral: true })
                    }
                    const user = interaction.options.getUser("user")
                    const member = interaction.options.getMember("user")
                    if (!rule || !rule.triggerMetadata.keywordFilter.includes(`<@${user.id}>`)) {
                        return interaction.reply(
                            `Người dùng này không phải là AFK`
                        );
                    }
 
                    let keywords = await rule.triggerMetadata.keywordFilter
                    keywords = keywords.filter(words => words !== `<@${user.id}>`)
                    rule.edit({
                        triggerMetadata: {
                            keywordFilter: keywords,
                        },
                    });
                    const name = member.nickname || user.displayname || user.username
                    if (name.startsWith('[AFK]')) {
                        const newname = name.slice(6)
                        await member.setNickname(newname)
                    }
                    interaction.reply(`Người dùng ${user} đã được gỡ bỏ trạng thái AFK thành công`);
                }
                break;
                case "info":
                    {
 
 
                        if (!rule ) {
                            return interaction.reply(
                                `Có vẻ như chưa ai từng AFK trong máy chủ này`
                            );
                        }
    
                        let keywords = await rule.triggerMetadata.keywordFilter
                        keywords = keywords.filter(words => words !== `<@1>`)
                        const embed = new EmbedBuilder()
                        .setTitle(`Thông tin chặn mention AFK`)
                        .setFooter({text : `Lưu ý rằng tất cả quản trị viên đều bỏ qua hệ thống này`})
                        const loop = keywords.length
                        if(loop === 0){
                            embed.addFields({name : `**Người dùng AFK:**`, value : `<:PinkCheck:1179406997997748336> Không có người dùng nào đang AFK`, inline : true})
                        }
                        else if(loop < 11){
 
                            let afkusers = ''
                            for(let i = 0; i< loop; i++){
                            if(i + 1 < loop){
                                const userId = keywords[i].match(/\d+/)[0];
 
                                const member = await interaction.guild.members.fetch(userId)
                                const user = await interaction.client.users.fetch(userId)
                                const name = member.nickname || user.displayname || user.username
 
                                afkusers += `<:PinkCheck:1179406997997748336> ${name}\n`;
                            }
                            else{
                                const userId = keywords[i].match(/\d+/)[0];
                                const member = await interaction.guild.members.fetch(userId)
                                const user = await interaction.client.users.fetch(userId)
                                const name = member.nickname || user.displayname || user.username
                            
                                afkusers+=`<:PinkCheck:1179406997997748336> ${name}\n`
                            }
                            }
                            embed.addFields({name : `**Người dùng AFK**`, value : afkusers, inline : true})
                        }
                        else{
                            embed.addFields({name : `**Người dùng AFK**`, value : `<:PinkCheck:1179406997997748336> ${loop} người dùng đang AFK`, inline : true})
                        }
                        let exemptchannels = Array.from(rule.exemptChannels.keys())
                        let exemptroles = Array.from(rule.exemptRoles.keys())
                        if(exemptroles.length === 0){
                            embed.addFields({name : `**Vai trò được bỏ qua từ AFK**`, value : `<:PinkCheck:1179406997997748336> Không có vai trò nào được bỏ qua`, inline : true})
                        }
                        else{
                            let roles = ''
                            for(let i = 0; i < exemptroles.length; i++){
                                if(i + 1 < exemptroles.length){
                                    roles += `<:PinkCheck:1179406997997748336> <@&${exemptroles[i]}>\n`;
                                }
                                else{
                                    roles +=`<:PinkCheck:1179406997997748336> <@&${exemptroles[i]}>\n`
                                }
                            }
                            embed.addFields({name : `**Vai trò được bỏ qua từ AFK**` , value : `${roles}`, inline : true});
                        }
                        if(exemptchannels.length === 0){
                            embed.addFields({name : `**Kênh được bỏ qua từ AFK**`, value : `<:PinkCheck:1179406997997748336> Không có kênh nào được bỏ qua`, inline : true})
                        }
                        else{
                            let channels = ''
                            for(let i = 0; i < exemptchannels.length; i++){
                                if(i + 1 < exemptchannels.length){
                                    channels += `<:PinkCheck:1179406997997748336> <#${exemptchannels[i]}>\n`;
                                }
                                else{
                                    channels +=`<:PinkCheck:1179406997997748336> <#${exemptchannels[i]}>\n`
                                }
                            }
                            embed.addFields({name : `**Kênh được bỏ qua từ AFK**` , value : `${channels}`, inline : true});
                        }
                        interaction.reply({embeds : [embed]})
 
 
                    }
                    break;
            case "warning":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `Bạn không có quyền cần thiết để làm điều này`, ephemeral: true })
                    }
                    const channel = interaction.options.getChannel("channel");
 
                    if (!channel || channel.type !== ChannelType.GuildText) {
                        return interaction.reply("Vui lòng nhập một kênh văn bản");
                    }
                    rule.edit({
                        actions: [
                            {
                                type: 1,
                                metadata: {
                                    customMessage:
                                    "Người dùng này hiện đang AFK, tôi đã chặn tin nhắn này để tránh làm phiền họ",
                                },
                            },
                            {
                                type: 2,
                                metadata: {
                                    channel: channel.id,
                                },
                            },
                        ],
                    });
 
                    interaction.reply("Kênh cảnh báo của bạn đã được cập nhật");
                }
                break;
 
            case "remove-warning": {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                    return interaction.reply({ content: `Bạn không có quyền cần thiết để làm điều này`, ephemeral: true })
                }
                rule.edit({
                    actions: [
                        {
                            type: 1,
                            metadata: {
                                customMessage:
                                    "Người dùng này hiện đang AFK, tôi đã chặn tin nhắn này để tránh làm phiền họ",
                            },
                        },
                    ],
                });
 
                interaction.reply("Kênh cảnh báo của bạn đã được gỡ bỏ"); 
            }
        }
    },
};
const {
    Client,
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");
const linkSchema = require("../../Models/antilink");
const antilinkLogSchema = require("../../Models/antilinkLogChannel");
const ms = require("ms");

module.exports = {
    name: "messageCreate",
    async execute(msg, client) {
        if (!msg.guild) return;
        if (msg.author?.bot) return;

        // Thêm mảng allowedChannels tại đây
        const allowedChannels = ["1181147913703936021", "1174937441556238396"]; // Thay thế bằng các ID kênh được phép của bạn

        // Kiểm tra xem tin nhắn có được gửi trong kênh được phép không
        if (allowedChannels.includes(msg.channel.id)) {
            // Không làm gì cả và thoát khỏi hàm
            return;
        }

        let requireDB = await linkSchema.findOne({ _id: msg.guild.id });
        const data = await antilinkLogSchema.findOne({ Guild: msg.guild.id });
        if (!data) return;
        if (!requireDB) return;

        if (requireDB.logs === false) return;

        if (requireDB.logs === true) {
            const memberPerms = data.Perms;
            const user = msg.author;
            const member = msg.guild.members.cache.get(user.id);

            if (member.permissions.has(memberPerms)) return;
            else {
                const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+)/gi;
                const content = msg.content.toLowerCase();
                const words = content.split(' ');

                let hasLink = false; // Biến để kiểm tra xem có liên kết trong tin nhắn không

                for (const word of words) {
                    if (linkRegex.test(word)) {
                        hasLink = true;
                        break; // Nếu có liên kết, thoát khỏi vòng lặp
                    }
                }

                if (hasLink) {
                    msg.delete();

                    // Gửi cảnh báo
                    const warningEmbed = new EmbedBuilder()
                        .setDescription(`:warning: | Liên kết không được phép trên máy chủ này, ${user}.`)
                        .setColor(0xecb2fb);

                    msg.channel.send({ embeds: [warningEmbed] }).catch(console.error);

                    const logChannel = client.channels.cache.get(data.logChannel);

                    if (logChannel) {
                        const logMsg = await logChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xecb2fb)
                                    .setDescription(`<@${user.id}> đã bị cảnh báo vì gửi link.\n\`\`\`${msg.content}\`\`\``)
                                    .setFooter({ text: `User ID: ${user.id}` })
                                    .setTimestamp()
                            ],
                        });
                            const col = await logMsg.createMessageComponentCollector({
                                componentType: ComponentType.Button,
                            });

                            col.on("collect", async (m) => {
                                switch (m.customId) {
                                    case "linktimeout": {
                                        if (!m.member.permissions.has(PermissionFlagsBits.ModerateMembers))
                                            return m.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor(0xecb2fb)
                                                        .setDescription(`:warning: | ${m.user} thiếu quyền *moderate_members*, vui lòng thử lại sau khi bạn có được quyền này.`)
                                                ],
                                                ephemeral: true,
                                            });

                                        if (!msg.member) {
                                            return m.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setDescription(`:warning: | Mục tiêu được chỉ định rất có thể đã rời khỏi máy chủ.`)
                                                        .setColor(0xecb2fb)
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        m.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(0xecb2fb)
                                                    .setDescription(`:white_check_mark: | ${msg.member} đã bị mute trong 10 phút.`)
                                            ],
                                            ephemeral: true,
                                        });

                                        const timeoutEmbed = new EmbedBuilder()
                                            .setTitle("Timeout")
                                            .setDescription(
                                                `:warning: | Bạn đã bị mute từ \`${msg.guild.name}\` vì gửi link.`
                                            )
                                            .setTimestamp()
                                            .setColor(0xecb2fb);

                                        msg.member
                                            .send({
                                                embeds: [timeoutEmbed],
                                            })
                                            .then(() => {
                                                const time = ms("10m");
                                                msg.member.timeout(time);
                                            });
                                    }
                                        break;

                                    case "linkkick": {
                                        if (!m.member.permissions.has(PermissionFlagsBits.KickMembers))
                                            return m.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor(0xecb2fb)
                                                        .setDescription(`:warning: | ${m.user} is missing the *kick_members* permission, please try again after you gain this permission.`)
                                                ],
                                                ephemeral: true,
                                            });

                                        const kickEmbed = new EmbedBuilder()
                                            .setTitle("Kicked")
                                            .setDescription(
                                                `:warning: | You have been kicked from \`${msg.guild.name}\` for sending links.`
                                            )
                                            .setTimestamp()
                                            .setColor(0xecb2fb);

                                        if (!msg.member) {
                                            return m.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setDescription(`:warning: | The target specified has most likely left the server.`)
                                                        .setColor(0xecb2fb)
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        m.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(0xecb2fb)
                                                    .setDescription(`:white_check_mark: | ${msg.member} has been successfully kicked from the server.`)
                                            ],
                                            ephemeral: true,
                                        });

                                        msg.member
                                            .send({
                                                embeds: [kickEmbed],
                                            })
                                            .then(() => {
                                                msg.member.kick({ reason: "Sending links." });
                                            });
                                    }
                                        break;
                                }
                            });
                        };
                    };
                };
            };
    },
};
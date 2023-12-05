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
    /**
     * @param {Client} client
     */
    async execute(msg, client) {
        if (!msg.guild) return;
        if (msg.author?.bot) return;

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
                const e = new EmbedBuilder()
                    .setDescription(`:warning: | Liên kết không được phép trong server này, ${user}.`)
                    .setColor(0xECB2FB);

                const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+)/gi; // Biểu thức chính quy để kiểm tra URL và liên kết discord.gg/

                const content = msg.content.toLowerCase();
                const words = content.split(' ');

                for (const word of words) {
                    if (linkRegex.test(word)) {
                        msg.delete();
                        const logChannel = client.channels.cache.get(data.logChannel);

                        if (!logChannel) return;
                        else {
                            const buttons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Timeout")
                                        .setEmoji("🔨")
                                        .setCustomId("linktimeout")
                                        .setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder()
                                        .setLabel("Kick")
                                        .setEmoji("🛠️")
                                        .setCustomId("linkkick")
                                        .setStyle(ButtonStyle.Danger)
                                );

                            // Gửi tin nhắn đến kênh log.
                            const logMsg = await logChannel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(0xECB2FB)
                                        .setDescription(`<@${user.id}> đã bị cảnh báo vì gửi một liên kết.\n\`\`\`${msg.content}\`\`\``)
                                        .setFooter({ text: `ID Người Dùng: ${user.id}` })
                                        .setTimestamp()
                                ],
                                components: [buttons]
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
                                                        .setColor(0xECB2FB)
                                                        .setDescription(`:warning: | ${m.user} thiếu quyền *moderate_members*, vui lòng thử lại sau khi bạn có quyền này.`)
                                                ],
                                                ephemeral: true,
                                            });

                                        if (!msg.member) {
                                            return m.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setDescription(`:warning: | Đối tượng được chỉ định có thể đã rời khỏi server.`)
                                                        .setColor(0xECB2FB)
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        m.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(0xECB2FB)
                                                    .setDescription(`:white_check_mark: | ${msg.member} đã bị cấm gửi tin nhắn trong 10 phút.`)
                                            ],
                                            ephemeral: true,
                                        });

                                        const timeoutEmbed = new EmbedBuilder()
                                            .setTitle("Cấm Gửi Tin Nhắn")
                                            .setDescription(
                                                `:warning: | Bạn đã bị cấm gửi tin nhắn từ \`${msg.guild.name}\` vì gửi liên kết.`
                                            )
                                            .setTimestamp()
                                            .setColor(0xECB2FB)

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
                                                        .setColor(0xECB2FB)
                                                        .setDescription(`:warning: | ${m.user} thiếu quyền *kick_members*, vui lòng thử lại sau khi bạn có quyền này.`)
                                                ],
                                                ephemeral: true,
                                            });

                                        const kickEmbed = new EmbedBuilder()
                                            .setTitle("Đã Đuổi")
                                            .setDescription(
                                                `:warning: | Bạn đã bị đuổi khỏi \`${msg.guild.name}\` vì gửi liên kết.`
                                            )
                                            .setTimestamp()
                                            .setColor(warningColor);

                                        if (!msg.member) {
                                            return m.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setDescription(`:warning: | Đối tượng được chỉ định có thể đã rời khỏi server.`)
                                                        .setColor(0xECB2FB)
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        m.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(0xECB2FB)
                                                    .setDescription(`:white_check_mark: | ${msg.member} đã bị đuổi khỏi server thành công.`)
                                            ],
                                            ephemeral: true,
                                        });

                                        msg.member
                                            .send({
                                                embeds: [kickEmbed],
                                            })
                                            .then(() => {
                                                msg.member.kick({ reason: "Gửi liên kết." });
                                            });
                                    }
                                        break;
                                }
                            });
                        };
                    };
                };
            };
        };
    },
};

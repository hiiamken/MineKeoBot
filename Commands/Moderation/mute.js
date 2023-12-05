    const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
    const ms = require("ms");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName("mute")
            .setDescription("Câm lặng một người trong máy chủ.")
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setDMPermission(false)
            .addUserOption(option => 
                option.setName("name")
                    .setDescription("Lựa chọn người muốn câm lặng.")
                    .setRequired(true)
            )
            .addStringOption(option => 
                option.setName("time")
                    .setDescription("Thời gian câm lặng.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName("reason")
                    .setDescription("Lí do người này bị câm lặng.")
            ),

        async execute(interaction) {
            const { guild, options } = interaction;

            const user = options.getUser("name");
            const member = guild.members.cache.get(user.id);
            const time = options.getString("time");
            const convertedTime = ms(time);
            const reason = options.getString("reason") || "Không có lí do";

            const errEmbed = new EmbedBuilder()
                .setDescription('Lỗi rồi, hãy thử lại!')
                .setColor(0xECB2FB);

            const successEmbed = new EmbedBuilder()
                .setTitle(":white_check_mark: **Muted**")
                .setDescription(`Staff đã mute cho ${user.tag}.`)
                .addFields(
                    { name: "Lí do", value: `${reason}`, inline: true },
                    { name: "Thời hạn:", value: `${time}`, inline: true }
                )
                .setColor(0xECB2FB)
                .setTimestamp();

            if (member.roles.highest.position >= interaction.member.roles.highest.position)
                return interaction.reply({ embeds: [errEmbed], ephemeral: true });

            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
                return interaction.reply({ embeds: [errEmbed], ephemeral: true });

            if (!convertedTime)
                return interaction.reply({ embeds: [errEmbed], ephemeral: true });
                
            try {
                    await member.timeout(convertedTime, reason);
        
                    interaction.reply({embeds: [successEmbed], ephemeral: false});
                } catch (err) {
                    console.log(err);
                }
        },
    };

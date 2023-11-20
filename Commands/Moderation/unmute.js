const {Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Bỏ câm lặng người chơi.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
        option.setName("name")
        .setDescription("Lựa chọn người muốn bỏ câm lặng.")
        .setRequired(true)
        ),
    async execute(interaction) {
        const {guild, options} = interaction;

        const user = options.getUser("name");
        const member = guild.members.cache.get(user.id);

        const errEmbed = new EmbedBuilder()
            .setDescription('Lỗi rồi, hãy thử lại!')
            .setColor(0xECB2FB);

        const successEmbed = new EmbedBuilder()
            .setTitle(":white_check_mark: **Unmuted**")
            .setDescription(`Staff đã gỡ mute cho ${user}.`)
            .setColor(0xECB2FB)
            .setTimestamp();

        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        try {
            await member.timeout(null);

            interaction.reply({embeds: [successEmbed], ephemeral: false});
        } catch (err) {
            console.log(err);
        }
    }
}
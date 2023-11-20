const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Gỡ cấm một người.")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName("userid")
                .setDescription("ID người chơi muốn gỡ cấm.")
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const { channel, options } = interaction;

        const userId = options.getString("userid");

        try {
            // Lấy thông tin member bị cấm
            const bannedUser = await interaction.guild.bans.fetch(userId);

            // Gỡ cấm
            await interaction.guild.bans.remove(bannedUser.user, 'Unban command executed');

            const embed = new EmbedBuilder()
                .setDescription(`Gỡ ban thành công cho người chơi có ID: ${userId}.`)
                .setColor(0xECB2FB)
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
            });
        } catch (err) {
            console.log(err);

            const errEmbed = new EmbedBuilder()
                .setDescription(`Không thể gỡ ban cho người chơi có ID: ${userId}.`)
                .setColor(0xECB2FB)
            interaction.reply({embeds: [errEmbed], ephemeral: true});
        }
    }
};

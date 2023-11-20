const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Cấm một người chơi khỏi máy chủ.")
        .setDefaultPermission(false) // Tắt quyền mặc định
        .addUserOption(option =>
            option.setName("name")
                .setDescription("Tên người muốn cấm.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Lí do muốn cấm.")
        ),

    async execute(interaction) {
        const { options, guild, member } = interaction;

        // Kiểm tra xem người gửi lệnh có vai trò cụ thể không
        const allowedRoles = ['1121667704298946600', '1121764644403560469']; // Thay RoleID1, RoleID2 bằng ID của các vai trò được phép
        const hasAllowedRole = member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
            // Nếu người gửi lệnh không có vai trò được phép, không thực hiện lệnh
            return interaction.reply({
                content: "Bạn không có quyền thực hiện lệnh này.",
                ephemeral: true
            });
        }

        const user = options.getUser("name");
        const reason = options.getString("reason") || "Không có lí do";

        const targetMember = await guild.members.fetch(user.id);

        const errEmbed = new EmbedBuilder()
            .setDescription(`Không thể cấm ${user.username} vì họ có quyền cao hơn.`)
            .setColor(0xECB2FB);

        if (targetMember.roles.highest.position >= member.roles.highest.position)
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        await targetMember.ban({ reason });

        const embed = new EmbedBuilder()
            .setDescription(`Cấm ${user.tag} thành công với lí do: ${reason}`)
            .setColor(0xECB2FB)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

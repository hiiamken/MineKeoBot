const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Đuổi một người khỏi máy chủ.")
        .setDefaultPermission(false) // Tắt quyền mặc định
        .addUserOption(option =>
            option.setName("name")
                .setDescription("Tên người bạn muốn đuổi.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Lí do muốn đuổi.")
        )
        .addRoleOption(option => // Thêm option để chọn role muốn thêm sau khi đuổi
            option.setName("role")
                .setDescription("Vai trò muốn thêm cho người chơi sau khi đuổi.")
        ),

    async execute(interaction) {
        const { channel, options, guild } = interaction;

        // Thêm logic để kiểm tra quyền của vai trò
        const allowedRoles = ["1121667704298946600", "1121764644403560469"]; // Thay thế bằng ID của các vai trò được phép
        const memberRoles = interaction.member.roles.cache;

        if (!allowedRoles.some(roleID => memberRoles.has(roleID))) {
            const errEmbed = new EmbedBuilder()
                .setDescription("Bạn không có quyền sử dụng lệnh này.")
                .setColor(0xECB2FB);
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }

        const user = options.getUser("name");
        const reason = options.getString("reason") || "Không có lí do";
        const member = await guild.members.fetch(user.id);

        const errEmbed = new EmbedBuilder()
            .setDescription(`Bạn không thể làm điều này vì ${user.username} có quyền cao hơn bạn!`)
            .setColor(0xECB2FB);

        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        // Lấy vai trò từ option
        const roleOption = options.getRole("role");

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setDescription(`Người chơi ${user} với lí do: ${reason}`);

        // Thêm vai trò nếu được chọn
        if (roleOption) {
            await member.roles.add(roleOption);
            embed.addField("Vai trò mới", roleOption.toString());
        }

        await interaction.reply({
            embeds: [embed],
        });
    },
};

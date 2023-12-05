const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const dayjs = require("dayjs");

// Đối tượng chứa ngày reset cho từng cụm và mùa
const ngayResetChoCumVaMua = {
    sugus: {
        1: "2023-04-15T00:00:00",
        2: "2023-06-15T00:00:00",
        3: "2023-08-01T00:00:00",
        4: "2024-01-30T00:00:00",
        5: "2024-04-30T00:00:00",
        6: "2024-07-30T00:00:00"
    },
    kitkat: {
        1: "2023-03-06T12:00:00",
        2: "2024-07-20T12:00:00",
        3: "2024-09-01T12:00:00",
        4: "2023-10-16T00:00:00",
        5: "2023-12-25T00:00:00",
        6: "2024-02-25T00:00:00"
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("thoigian")
        .setDescription("Kiểm tra thời gian bắt đầu các mùa các cụm tại MineKeo.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("cum")
                .setDescription("Chọn cụm")
                .addChoices(
                    { name: 'Sugus', value: 'sugus' },
                    { name: 'Kitkat', value: 'kitkat' }
                )
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("mua")
                .setDescription("Chọn mùa")
                .addChoices(
                    { name: 'Mùa 1', value: 1 },
                    { name: 'Mùa 2', value: 2 },
                    { name: 'Mùa 3', value: 3 },
                    { name: 'Mùa 4', value: 4 },
                    { name: 'Mùa 5', value: 5 },
                    { name: 'Mùa 6', value: 6 }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const { options } = interaction;

        const selectedCum = options.getString("cum");
        const selectedMua = options.getInteger("mua");

        // Tính thời gian reset
        const ngayResetString = ngayResetChoCumVaMua[selectedCum][selectedMua];
        const ngayReset = dayjs(ngayResetString);
        const ngayHienTai = dayjs();
        const thoiGianConLai = ngayReset.diff(ngayHienTai, 'second');

        if (thoiGianConLai <= 0) {
            await interaction.reply({ content: `Cụm ${selectedCum} mùa ${selectedMua} đã reset.`, ephemeral: true });
        } else {
            // Gửi tin nhắn và cập nhật sau mỗi giây
            const countdownMessage = await interaction.reply({ content: `Cụm ${selectedCum} mùa ${selectedMua} sẽ reset sau: ${formatDuration(thoiGianConLai)}.`, ephemeral: true });
            const countdownInterval = setInterval(() => {
                const thoiGianConLaiHienTai = ngayReset.diff(dayjs(), 'second');
                if (thoiGianConLaiHienTai <= 0) {
                    clearInterval(countdownInterval);
                    countdownMessage.edit({ content: `Cụm ${selectedCum} mùa ${selectedMua} đã reset (Ngày ${ngayReset.format("DD/MM/YYYY")}).`, ephemeral: true });
                } else {
                    countdownMessage.edit({ content: `Cụm ${selectedCum} mùa ${selectedMua} sẽ bắt đầu sau: **${formatDuration(thoiGianConLaiHienTai)}** (Ngày ${ngayReset.format("DD/MM/YYYY")}).`, ephemeral: true });
                }
            }, 1000); // Cập nhật mỗi giây
        }

        // Kết thúc execute
    },
};

// Hàm chuyển đổi giây thành chuỗi định dạng giờ, phút, giây
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours} giờ, ${minutes} phút, ${remainingSeconds} giây`;
}

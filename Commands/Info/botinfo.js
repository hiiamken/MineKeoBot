const { SlashCommandBuilder } = require("discord.js");
const cpuStat = require("cpu-stat");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Các thông tin về bot."),

    async execute(interaction, client) {
        try {
            // Kiểm tra xem sự tương tác đã được xử lý hay chưa
            if (!interaction.deferred && !interaction.replied) {
                // Hoãn lại trả lời để thông báo cho Discord rằng bạn đang xử lý
                await interaction.deferReply({ ephemeral: true });

                const days = Math.floor(client.uptime / 86400000);
                const hours = Math.floor(client.uptime / 3600000) % 24;
                const minutes = Math.floor(client.uptime / 60000) % 60;
                const seconds = Math.floor(client.uptime / 1000) % 60;

                cpuStat.usagePercent(async function (error, percent) {
                    if (error) {
                        return interaction.editReply({ content: `${error}`, ephemeral: true });
                    }

                    const memoryUsage = formatBytes(process.memoryUsage().heapUsed);
                    const node = process.version;
                    const cpu = percent.toFixed(2);

                    const embed = {
                        title: "Thông tin Bot",
                        color: 0xECB2FB,
                        fields: [
                            { name: "Developer", value: "Ken", inline: true },
                            { name: "Tên bot", value: `${client.user.username}`, inline: true },
                            { name: "ID", value: `${client.user.id}`, inline: true },
                            { name: "Ngày tạo:", value: "01/11/2023" },
                            { name: "Phiên bản:", value: "2.0.1" },
                            { name: "Các lệnh có thể dùng:", value: "/help" },
                            { name: "Uptime:", value: ` \`${days}\` ngày, \`${hours}\` giờ, \`${minutes}\` phút, \`${seconds}\` giây.` },
                            { name: "Bot-Ping:", value: `${client.ws.ping}ms` },
                            { name: "Lập trình bằng:", value: `Node ${node}` },
                            { name: "CPU sử dụng:", value: `${cpu}` },
                            { name: "Memory sử dụng:", value: `${memoryUsage}` }
                        ]
                    };

                    // Chỉnh sửa trả lời đã hoãn lại với embed
                    await interaction.editReply({ embeds: [embed] });
                });
            } else {
                console.log("Sự tương tác đã được xử lý hoặc đã được hoãn lại trước đó.");
            }
        } catch (error) {
            console.error(error);
        }
    }
};

function formatBytes(a, b) {
    let c = 1024;
    d = b || 2;
    e = ['B', 'KB', 'MB', 'GB', 'TB'];
    f = Math.floor(Math.log(a) / Math.log(c));

    return parseFloat((a / Math.pow(c, f)).toFixed(d)) + '' + e[f];
}

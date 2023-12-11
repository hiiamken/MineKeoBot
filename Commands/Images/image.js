const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const axios = require('axios');

api = 'JOTf4AJq4b4xt6FWlxQWnIaIwHq41gGi'; // Khóa API của bạn từ wallhaven

module.exports = {
    data: new SlashCommandBuilder()
        .setName("image")
        .setDescription("Tìm hình")
        .setDMPermission(false)
        .addStringOption((option) =>
            option.setName("search")
                .setDescription("Tìm kiếm hình ảnh cụ thể.")
                .setRequired(true))
        .addStringOption(CategoryOption())
        .addStringOption(PurityOption())
        .addStringOption(RatiosOption())
        .addStringOption(SortingOption())
        .addStringOption(ColorOption())
        .addStringOption(AIFilterOption()),
    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {

        if (interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            const channelMention = `<#${allowedChannel.id}>`;

            return interaction.reply({
                content: `Bạn chỉ có thể sử dụng lệnh này trong ${channelMention}.`,
                ephemeral: true,
            });
        }

        const { options } = interaction;
        try {
            const query = options.getString("search").replace(" ", "+") || null;
            const categoryCode = options.getString("category") || '111';
            const purityCode = options.getString("purity") || '100';
            const ratios = options.getString("ratios") || '';
            let sortingMethod = options.getString("sorting") || 'random';
            const colorCode = options.getString("color") || '';
            const ai_filter = options.getString("ai_filter") || '0';

            if (!query) {
                await interaction.reply("Vui lòng cung cấp một truy vấn tìm kiếm.");
                return;
            }

            if (!api && purityCode === '001') {
                await interaction.reply("Tùy chọn NSFW không khả dụng nếu không có khóa API hợp lệ.");
                return;
            }

            if (sortingMethod === 'toplist') {
                sortingMethod = '&topRange=1y&sorting=toplist';
            }

            const baseUrl = api ? `https://wallhaven.cc/api/v1/search?apikey=${api}&` : `https://wallhaven.cc/api/v1/search?`;
            const apiUrl = `${baseUrl}q=${query}&categories=${categoryCode}&purity=${purityCode}&ratios=${ratios}&sorting=${sortingMethod}&colors=${colorCode}&ai_art_filter=${ai_filter}`;

            const response = await axios.get(apiUrl);
            const msg = response.data.data[0].path;
            interaction.reply(msg);

        } catch (error) {
            if (error.response) {
                if (error.response.status === 429) {
                    await interaction.reply("Đạt đến giới hạn tần suất API. Vui lòng đợi trước khi thực hiện yêu cầu khác.");
                } else if (error.response.status === 401) {
                    await interaction.reply("Không được phép. Vui lòng kiểm tra khóa API của bạn.");
                }
            } else {
                console.error("Lỗi khi truy xuất Wallhaven API:", error.message);
                await interaction.reply("Đã xảy ra lỗi khi tải hình ảnh. Vui lòng thử lại sau.");
            }
        }
    }
}

function CategoryOption() {
    return (option) =>
        option.setName("category")
            .setDescription("Danh mục của hình ảnh")
            .addChoices(
                { name: 'Người', value: '001' },
                { name: 'Anime', value: '010' },
                { name: 'Chung', value: '100' },
            );
}

function PurityOption() {
    return (option) =>
        option.setName("purity")
            .setDescription("Độ thuần khiết của hình ảnh")
            .addChoices(
                { name: 'SFW', value: '100' },
                { name: 'Sketchy', value: '010' },
                { name: 'NSFW', value: '001' },
            );
}

function RatiosOption() {
    return (option) =>
        option.setName("ratios")
            .setDescription("Tỷ lệ khung hình của hình ảnh")
            .addChoices(
                { name: 'Quang cảnh', value: 'landscape' },
                { name: 'Chân dung', value: 'portrait' },
            );
}

function SortingOption() {
    return (option) =>
        option.setName("sorting")
            .setDescription("Phương pháp sắp xếp kết quả")
            .addChoices(
                { name: 'Ngày', value: 'date_added' },
                { name: 'Liên quan', value: 'relevance' },
                { name: 'Ngẫu nhiên', value: 'random' },
                { name: 'Lượt xem', value: 'views' },
                { name: 'Yêu thích', value: 'favorites' },
                { name: 'Danh sách hàng đầu', value: 'toplist' },
                { name: 'Nóng', value: 'hot' },
            );
}

function ColorOption() {
    return (option) =>
        option.setName("color")
            .setDescription("Tìm kiếm theo màu sắc")
            .addChoices(
                { name: 'Đỏ máu', value: '660000' },
                { name: 'Đỏ thắm', value: '990000' },
                { name: 'Đỏ đua (Rosso Corsa)', value: 'cc0000' },
                { name: 'Đỏ Persian', value: 'cc3333' },
                { name: 'Đỏ Violet', value: 'ea4c88' },
                { name: 'Violet sống động', value: '993399' },
                { name: 'Rebecca Purple', value: '663399' },
                { name: 'Cosmic Cobalt', value: '333399' },
                { name: 'Bright Navy Blue', value: '0066cc' },
                { name: 'Pacific Blue', value: '0099cc' },
                { name: 'Medium Turquoise', value: '66cccc' },
                { name: 'Yellow Green', value: '77cc33' },
                { name: 'Olive Drab', value: '669900' },
                { name: 'Xanh đậm', value: '336600' },
                { name: 'Đồng cổ', value: '666600' },
                { name: 'Đồng', value: '999900' },
                { name: 'Mustard Green', value: 'cccc33' },
                { name: 'Vàng', value: 'ffff00' },
                { name: 'Sunglow', value: 'ffcc33' },
                { name: 'Vỏ cam', value: 'ff9900' },
                { name: 'Cam (Crayola)', value: 'ff6600' },
                { name: 'Nâu vàng', value: '996633' },
                { name: 'Đen', value: '000000' },
                { name: 'Xám Tây Ban Nha', value: '999999' },
                { name: 'Peacoat', value: '424153' },
            );
}

function AIFilterOption() {
    return (option) =>
        option.setName("ai_filter")
            .setDescription("Bộ lọc AI")
            .addChoices(
                { name: 'Hiển thị nghệ thuật AI', value: '0' },
                { name: 'Chặn nghệ thuật AI', value: '1' },
            );
}

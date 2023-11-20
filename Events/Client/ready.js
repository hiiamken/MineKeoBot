const mongoose = require('mongoose');
const config = require("../../config.json");
const { Activity, ActivityType } = require('discord.js');

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        try {
            await mongoose.connect(config.mongodb || '');

            console.log('Đã kết nối thành công MongoDB.');
        } catch (error) {
            console.error('Kết nối MongoDB thất bại:', error);
        }

        console.log(`${client.user.username} đang sẵn sàng!`);

        const status = await client.user.setPresence({
            status: 'idle',
            activities: [{
                type: ActivityType.Custom,
                name: 'customname',
                state: 'Máy chủ tệ nhất Việt Nam'
            }]
        });
    },
};

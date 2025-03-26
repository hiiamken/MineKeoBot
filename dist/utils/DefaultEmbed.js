"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEmbed = void 0;
// src/utils/DefaultEmbed.ts
const discord_js_1 = require("discord.js");
class DefaultEmbed extends discord_js_1.EmbedBuilder {
    constructor(data) {
        super(data);
        // Màu mặc định (VD: hồng nhẹ)
        this.setColor('#DEA2DD');
        // Bạn có thể thêm footer/timestamp mặc định, v.v.
    }
}
exports.DefaultEmbed = DefaultEmbed;

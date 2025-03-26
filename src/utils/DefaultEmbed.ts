// src/utils/DefaultEmbed.ts
import { EmbedBuilder, EmbedData } from 'discord.js';

export class DefaultEmbed extends EmbedBuilder {
  constructor(data?: EmbedData) {
    super(data);
    // Màu mặc định (VD: hồng nhẹ)
    this.setColor('#DEA2DD');
    // Bạn có thể thêm footer/timestamp mặc định, v.v.
  }
}

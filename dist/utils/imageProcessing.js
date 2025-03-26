"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharpenedAvatar = getSharpenedAvatar;
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
/**
 * Lấy buffer ảnh avatar đã được làm nét.
 * @param avatarUrl URL của avatar
 * @returns Buffer của ảnh đã được xử lý
 */
async function getSharpenedAvatar(avatarUrl) {
    // Tải ảnh về dạng buffer
    const response = await axios_1.default.get(avatarUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    // Áp dụng xử lý "sharpen" để làm nét ảnh
    const sharpenedBuffer = await (0, sharp_1.default)(imageBuffer)
        .sharpen() // Bạn có thể tùy chỉnh các tham số sharpen nếu muốn
        .toBuffer();
    return sharpenedBuffer;
}

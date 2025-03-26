"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePinkishCaptchaImage = generatePinkishCaptchaImage;
const canvas_1 = require("@napi-rs/canvas");
/**
 * Tạo captcha nâng cao với màu hồng nhẹ (#DEA2DD) cho ký tự thật,
 * đường cong, đồng thời ký tự bẫy (decoy) màu xám và nhỏ hơn.
 * @param length Số ký tự thật (mặc định 5)
 */
function generatePinkishCaptchaImage(length = 5) {
    // 1) Tạo chuỗi ký tự gốc
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Kích thước canvas
    const width = 320;
    const height = 130;
    const canvas = (0, canvas_1.createCanvas)(width, height);
    const ctx = canvas.getContext('2d');
    // 2) Nền trắng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    // 3) Nhiễu lines mảnh, màu xám nhạt
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
    }
    // 4) Tạo các điểm path để vẽ đường cong + đặt ký tự
    const pathPoints = [];
    for (let i = 1; i <= length; i++) {
        const px = (i / (length + 1)) * (width - 40) + 20;
        const py = Math.random() * (height - 40) + 20;
        pathPoints.push({ x: px, y: py });
    }
    // 5) Vẽ đường cong màu hồng nhẹ (#DEA2DD)
    ctx.strokeStyle = '#DEA2DD';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
        const prev = pathPoints[i - 1];
        const curr = pathPoints[i];
        // Sử dụng quadraticCurveTo
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        ctx.quadraticCurveTo(midX, midY, curr.x, curr.y);
    }
    ctx.stroke();
    // 6) Vẽ ký tự thật, màu hồng nhẹ, cỡ to (VD 38px)
    ctx.fillStyle = '#DEA2DD';
    ctx.font = '38px Sans';
    pathPoints.forEach((pt, i) => {
        const char = text[i];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        // Xoay nhẹ
        const angle = (Math.random() - 0.5) * 0.6;
        ctx.rotate(angle);
        // Vẽ ký tự
        ctx.fillText(char, -12, 12);
        ctx.restore();
    });
    // 7) Thêm decoy (ký tự bẫy) màu xám, nhỏ hơn
    const decoyCount = 6;
    ctx.fillStyle = 'rgba(150,150,150,0.7)';
    for (let i = 0; i < decoyCount; i++) {
        const decoyChar = chars.charAt(Math.floor(Math.random() * chars.length));
        const dx = Math.random() * width;
        const dy = Math.random() * height;
        ctx.save();
        ctx.translate(dx, dy);
        const angle = (Math.random() - 0.5) * 1.0;
        ctx.rotate(angle);
        // Kích thước nhỏ hơn, random
        const decoySize = 18 + Math.random() * 6;
        ctx.font = `${decoySize}px Sans`;
        ctx.fillText(decoyChar, 0, 0);
        ctx.restore();
    }
    // 8) Xuất buffer
    const buffer = canvas.toBuffer('image/png');
    return { buffer, text };
}

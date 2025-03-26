import axios from 'axios';
import sharp from 'sharp';

/**
 * Lấy buffer ảnh avatar đã được làm nét.
 * @param avatarUrl URL của avatar
 * @returns Buffer của ảnh đã được xử lý
 */
export async function getSharpenedAvatar(avatarUrl: string): Promise<Buffer> {
  // Tải ảnh về dạng buffer
  const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data, 'binary');
  
  // Áp dụng xử lý "sharpen" để làm nét ảnh
  const sharpenedBuffer = await sharp(imageBuffer)
    .sharpen() // Bạn có thể tùy chỉnh các tham số sharpen nếu muốn
    .toBuffer();
    
  return sharpenedBuffer;
}

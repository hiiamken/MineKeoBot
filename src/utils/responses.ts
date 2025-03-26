// src/utils/responses.ts

// Mảng các tin nhắn phản hồi hài hước
export const avatarResponses: string[] = [
    "{emoji} Ôi trời, avatar của {username} đang tỏa sáng rực rỡ!",
    "{emoji} Ngắm nào, avatar của {username} đẹp đến mức không thể tin được!",
    "{emoji} Wow, avatar của {username} vừa đẹp vừa chất, phải không nào?",
    "{emoji} Avatar của {username} vừa bùng nổ vừa mê mẩn!",
    "{emoji} Dưới đây là avatar của {username} – một tác phẩm nghệ thuật đích thực!",
    "{emoji} Avatar của {username} đang khiến mọi ánh nhìn dán lại đây!",
    "{emoji} Chào mừng đến với thế giới avatar thần thái của {username}!",
    "{emoji} Không phải ai cũng có avatar đẹp như của {username} đâu nhé!",
    "{emoji} Avatar của {username} vừa là siêu phẩm vừa là 'món quà' cho mắt!",
    "{emoji} Đã đến lúc chiêm ngưỡng avatar cực 'xịn' của {username}!"
  ];
  
  // Hàm định dạng username: viết hoa chữ cái đầu và in đậm (markdown)
  function formatUsername(username: string): string {
    if (!username || username.length === 0) return "";
    const formatted = username.charAt(0).toUpperCase() + username.slice(1);
    return `**${formatted}**`;
  }
  
  // Hàm chọn ngẫu nhiên một tin nhắn và thay thế placeholder {username} và {emoji}
  export function getRandomAvatarResponse(username: string, emoji: string): string {
    const formattedUsername = formatUsername(username);
    const index = Math.floor(Math.random() * avatarResponses.length);
    return avatarResponses[index]
      .replace('{username}', formattedUsername)
      .replace('{emoji}', emoji);
  }
  
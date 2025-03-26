// src/automod/types.ts

/** Dữ liệu kênh trong bảng "channels" */
export interface ChannelRow {
    id: string;
    name: string;
    type?: string;       // Tuỳ theo cột trong DB
    position?: number;   // Tuỳ theo cột trong DB
  }
  
  /** Dữ liệu role trong bảng "roles" */
  export interface RoleRow {
    id: string;
    name: string;
    permissions: string; // Lưu permissions dưới dạng chuỗi
  }
  
  /** Dữ liệu ban trong bảng "bans" */
  export interface BanRow {
    user_id: string;
  }
  
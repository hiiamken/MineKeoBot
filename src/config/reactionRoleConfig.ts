// src/config/reactionRoleConfig.ts

export interface ReactionRoleConfig {
    message_id: string;
    guild_id: string;
    channel_id: string;
    type: 'normal' | 'unique';
    opening_text: string;
    closing_text: string;
  }
  
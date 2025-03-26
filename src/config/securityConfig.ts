// src/config/securityConfig.ts

const config = {
  antiNuke: {
    dangerousActionThreshold: 3,
    autoBanThreshold: 25,
    monitoredEvents: [
      "CHANNEL_CREATE",
      "CHANNEL_DELETE",
      "ROLE_CREATE",
      "ROLE_DELETE",
      "MEMBER_BAN_ADD",
      "WEBHOOK_CREATE",
      "WEBHOOK_DELETE",
      "MEMBER_KICK",
      "ROLE_UPDATE",
      "WEBHOOK_UPDATE",
      "EMOJI_UPDATE",
      "STICKER_UPDATE",
      "MEMBER_UPDATE",
      "GUILD_UPDATE",
      "CHANNEL_OVERWRITE_UPDATE"
    ],
    whitelistedUsers: [] as string[], // ✅ Người dùng được bỏ qua anti-nuke
    whitelistedRoles: [] as string[], // ✅ Ai có role này sẽ được bỏ qua
    quarantineRoleName: "Quarantine",

    // Cấu hình Lockdown
    lockdown: {
      enabled: false,
      lockdownDurationMinutes: 15,
      notifyOnLockdown: true,
      autoRestoreOnNuke: true,
      lastBackupId: null
    },

    // Cấu hình Panic Mode (granular freeze & auto disable)
    panicMode: {
      freezeRoleName: "Frozen",         // Tên role dùng để "đóng băng" user
      autoDisableAfterMs: 15 * 60 * 1000 // Tự động tắt Panic Mode sau 15 phút
    },

    // Bật tính năng adaptive threshold cho AntiNuke
    adaptiveThreshold: true,

    // Giới hạn số hành động nguy hiểm mỗi phút
    maxActionsPerMinute: 10,

    // Cấu hình antiWebhook
    antiWebhook: {
      maxWebhookPerMinute: 5 // ✅ Giới hạn số webhook được tạo mỗi phút
    },

    // Cấu hình alert levels
    alertLevels: {
      warning: 15,    // Từ 15 điểm trở lên: mức Warning
      critical: 25,   // Từ 25 điểm trở lên: mức Critical
      emergency: 40   // Từ 40 điểm trở lên: mức Emergency (kích hoạt toàn bộ)
    }
  },

  // Cấu hình backup
  backup: {
    backupIntervalMinutes: 60,
    backupOnPanic: true,
    messageBackupLimit: 250,
    backupRetentionDays: 30,
    storagePath: "./backups",
    backupComponents: [
      "role_assignments",
      "nicknames",
      "bans",
      "messages",
      "threads",
      "forum_posts",
      "channels"
    ]
  },

  // Cấu hình restore
  restore: {
    logChannelId: '1096806362060705904',
    requireApproval: true,
    suspiciousHours: [0,1,2,3,4,5,6]
  },

  // Cấu hình antiRaid
  antiRaid: {
    scoreLimit: 50,
    accountAgeThreshold: 5, // in days
    noAvatarScore: 5,
    accountAgeScore: 5,
    joinRowScore: 10,
    bypassAccountAge: 180 // in days
  },

  // Cấu hình adaptive threshold (dùng cho AntiNuke/AntiRaid)
  adaptiveThreshold: {
    enabled: true,           // Bật tính năng adaptive threshold
    baseThreshold: 25,       // Ngưỡng cơ bản nếu không có dữ liệu
    decayLambda: 0.1,        // Hằng số decay, tính theo giờ
    k: 1.5,                  // Hệ số nhân cho độ lệch chuẩn
    historyDurationMinutes: 60, // Khoảng thời gian tính thống kê
    accountAgeThreshold: 5,  // Ngưỡng tuổi tài khoản (ngày)
    weightAccountAge: 2,     // Trọng số cộng thêm nếu tài khoản mới (< accountAgeThreshold)
    weightNoAvatar: 3        // Trọng số cộng thêm nếu không có avatar
  },

  // Cấu hình logging
  logging: {
    logChannelId: "",
    reportMethod: "DM"
  }
};

export default config;

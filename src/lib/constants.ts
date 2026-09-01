// ============================================
// EduConnect Constants
// ============================================

export const APP_NAME = "studchat";
export const APP_DESCRIPTION = "Chat. Share. Learn. Together.";

// File upload limits (in bytes)
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_GENERAL_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_MATERIAL_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];
export const ALLOWED_ATTACHMENT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Chat
export const MESSAGES_PER_PAGE = 50;
export const SLOW_MODE_INTERVAL_MS = 30_000; // 30 seconds

// Moderation
export const STRIKE_DECAY_DAYS = 30;
export const MAX_STRIKES_BEFORE_SLOW_MODE = 2;
export const MAX_STRIKES_BEFORE_RESTRICTION = 3;
export const MAX_STRIKES_BEFORE_SUSPENSION = 5;
export const RESTRICTION_DURATION_HOURS = 48;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Reactions (limited set for educational context)
export const AVAILABLE_REACTIONS = ["👍", "❤️", "😂", "🎉", "🤔", "👀", "✅", "❌"];

// Subject color palette
export const SUBJECT_COLORS = [
  "#4F46E5", // Indigo
  "#0891B2", // Cyan
  "#059669", // Emerald
  "#D97706", // Amber
  "#DC2626", // Red
  "#7C3AED", // Violet
  "#DB2777", // Pink
  "#2563EB", // Blue
  "#EA580C", // Orange
  "#65A30D", // Lime
];

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  SETUP: "/setup",
  DASHBOARD: "/dashboard",
  SUBJECTS: "/subjects",
  SUBJECT: (id: string) => `/subjects/${id}`,
  SUBJECT_CHAT: (id: string) => `/subjects/${id}/chat`,
  SUBJECT_ANNOUNCEMENTS: (id: string) => `/subjects/${id}/announcements`,
  SUBJECT_MATERIALS: (id: string) => `/subjects/${id}/materials`,
  SUBJECT_ASSIGNMENTS: (id: string) => `/subjects/${id}/assignments`,
  ASSIGNMENT_DETAIL: (subjectId: string, assignmentId: string) =>
    `/subjects/${subjectId}/assignments/${assignmentId}`,
  ASSIGNMENT_SUBMIT: (subjectId: string, assignmentId: string) =>
    `/subjects/${subjectId}/assignments/${assignmentId}/submit`,
  ANNOUNCEMENTS: "/announcements",
  ASSIGNMENTS: "/assignments",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_CLASSES: "/admin/classes",
  ADMIN_SUBJECTS: "/admin/subjects",
  ADMIN_ENROLLMENT: "/admin/enrollment",
  ADMIN_MODERATION: "/admin/moderation",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

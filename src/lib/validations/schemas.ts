import { z } from "zod";

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

// ============================================
// Academic Schemas
// ============================================

export const createUniversitySchema = z.object({
  name: z.string().min(2, "University name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  address: z.string().optional(),
});

export const createInstituteSchema = z.object({
  university_id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  start_date: z.string(),
  end_date: z.string(),
  is_current: z.boolean().default(false),
});

export const createClassSchema = z.object({
  institute_id: z.string().uuid(),
  university_id: z.string().uuid(),
  name: z.string().min(1, "Department name is required"),
  sort_order: z.number().int().default(0),
});

export const createSemesterSchema = z.object({
  department_id: z.string().uuid(),
  university_id: z.string().uuid(),
  name: z.string().min(1, "Semester name is required"),
});

export const createSubjectSchema = z.object({
  semester_id: z.string().uuid(),
  university_id: z.string().uuid(),
  name: z.string().min(1, "Subject name is required"),
  description: z.string().optional(),
  color: z.string().default("#4F46E5"),
  icon: z.string().default("book"),
});

export const enrollMemberSchema = z.object({
  subject_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["teacher", "student"]),
});

// ============================================
// Messaging Schemas
// ============================================

export const sendMessageSchema = z.object({
  subject_id: z.string().uuid(),
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message is too long"),
  reply_to_id: z.string().uuid().optional().nullable(),
});

export const editMessageSchema = z.object({
  message_id: z.string().uuid(),
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message is too long"),
});

// ============================================
// Announcement Schemas
// ============================================

export const createAnnouncementSchema = z.object({
  university_id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  target_type: z.enum(["university", "department", "semester", "subject"]),
  target_id: z.string().uuid(),
  scheduled_at: z.string().optional().nullable(),
});

// ============================================
// Assignment Schemas
// ============================================

export const createAssignmentSchema = z.object({
  subject_id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  max_marks: z.number().positive().optional().nullable(),
  due_date: z.string().optional().nullable(),
  allow_late_submission: z.boolean().default(false),
  allow_resubmission: z.boolean().default(false),
});

export const submitAssignmentSchema = z.object({
  assignment_id: z.string().uuid(),
  content: z.string().optional(),
});

export const gradeSubmissionSchema = z.object({
  submission_id: z.string().uuid(),
  marks: z.number().min(0).optional().nullable(),
  feedback: z.string().optional(),
  status: z.enum(["graded", "returned"]),
});

// ============================================
// Report Schema
// ============================================

export const createReportSchema = z.object({
  university_id: z.string().uuid(),
  reported_user_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  category: z.enum([
    "abuse",
    "bullying",
    "harassment",
    "threat",
    "hate_speech",
    "sexual_content",
    "spam",
    "other",
  ]),
  description: z.string().optional(),
});

// ============================================
// Type exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateUniversityInput = z.infer<typeof createUniversitySchema>;
export type CreateInstituteInput = z.infer<typeof createInstituteSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type EnrollMemberInput = z.infer<typeof enrollMemberSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;

// ============================================
// Invite Code Schemas
// ============================================

export const generateInviteCodeSchema = z.object({
  university_id: z.string().uuid(),
  target_role: z.enum(['institute_head', 'teacher', 'student']),
  max_uses: z.number().int().min(1).default(1),
  expires_in_days: z.number().int().min(1).optional().nullable(),
});

export const useInviteCodeSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

export type GenerateInviteCodeInput = z.infer<typeof generateInviteCodeSchema>;
export type UseInviteCodeInput = z.infer<typeof useInviteCodeSchema>;

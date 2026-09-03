// ============================================
// Database Types — mirrors Supabase schema
// ============================================

export type UserRole = "teacher_admin" | "student_admin" | "teacher" | "student";
export type MemberStatus = "active" | "inactive" | "suspended";
export type SubjectRole = "teacher" | "student";
export type MessageStatus = "published" | "blocked" | "deleted" | "pending_review";
export type AnnouncementPriority = "normal" | "important" | "urgent";
export type AnnouncementTargetType = "university" | "department" | "semester" | "subject";
export type SubmissionStatus = "pending" | "submitted" | "late" | "graded" | "returned";
export type NotificationType =
  | "announcement"
  | "message_mention"
  | "assignment_created"
  | "assignment_due"
  | "submission_graded"
  | "submission_received"
  | "moderation_warning"
  | "report_update"
  | "system";
export type ReportCategory =
  | "abuse"
  | "bullying"
  | "harassment"
  | "threat"
  | "hate_speech"
  | "sexual_content"
  | "spam"
  | "other";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type ModerationAction = "warning" | "message_blocked" | "slow_mode" | "restricted" | "suspended";
export type ModerationUserStatus = "active" | "slow_mode" | "restricted" | "suspended";

// ============================================
// Table Row Types
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UniversityMembership {
  id: string;
  university_id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  joined_at: string;
}

export interface Institute {
  id: string;
  university_id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  institute_id: string;
  university_id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Semester {
  id: string;
  department_id: string;
  university_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  semester_id: string;
  university_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
}

export interface SubjectMember {
  id: string;
  subject_id: string;
  user_id: string;
  role: SubjectRole;
  joined_at: string;
}

export interface Message {
  id: string;
  subject_id: string;
  sender_id: string | null;
  content: string;
  status: MessageStatus;
  reply_to_id: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  edited_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface MessageReadCursor {
  user_id: string;
  subject_id: string;
  last_read_at: string;
  last_read_message_id: string | null;
}

export interface Announcement {
  id: string;
  university_id: string;
  author_id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target_type: AnnouncementTargetType;
  target_id: string;
  attachment_path: string | null;
  attachment_name: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  is_published: boolean;
  created_at: string;
}

export interface AnnouncementRead {
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface Material {
  id: string;
  subject_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  topic: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  download_count: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  created_by: string;
  title: string;
  description: string | null;
  instructions: string | null;
  max_marks: number | null;
  due_date: string | null;
  allow_late_submission: boolean;
  allow_resubmission: boolean;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  is_late: boolean;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Report {
  id: string;
  university_id: string;
  reporter_id: string;
  reported_user_id: string | null;
  message_id: string | null;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ModerationProfile {
  user_id: string;
  university_id: string;
  active_strikes: number;
  total_violations: number;
  status: ModerationUserStatus;
  restriction_expires_at: string | null;
  last_violation_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerationLog {
  id: string;
  university_id: string;
  user_id: string;
  action: ModerationAction;
  reason: string;
  message_content: string | null;
  performed_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  university_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ============================================
// Extended / Joined Types (for UI)
// ============================================

export interface MessageWithSender extends Message {
  sender: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  reply_to?: Pick<Message, "id" | "content" | "sender_id"> & {
    sender: Pick<Profile, "id" | "full_name"> | null;
  } | null;
}

export interface SubjectWithDetails extends Subject {
  semester: Semester & {
    department: Department & {
      institute: Institute;
    };
  };
  member_count: number;
  unread_count?: number;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: Pick<Profile, "id" | "full_name" | "avatar_url">;
  is_read?: boolean;
}

export interface AssignmentWithDetails extends Assignment {
  subject: Pick<Subject, "id" | "name" | "color" | "icon">;
  created_by_profile: Pick<Profile, "id" | "full_name">;
  submission?: AssignmentSubmission | null;
  submission_count?: number;
  total_students?: number;
}

export interface ReportWithDetails extends Report {
  reporter: Pick<Profile, "id" | "full_name" | "avatar_url">;
  reported_user: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  message: Pick<Message, "id" | "content" | "created_at"> | null;
}

// ============================================
// Auth Context Types
// ============================================

export interface UserContext {
  profile: Profile;
  memberships: (UniversityMembership & { university: University })[];
  activeUniversity: University | null;
  activeRole: UserRole;
}

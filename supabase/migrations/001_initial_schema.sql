-- ============================================
-- studchat Database Schema
-- Migration 001: Initial Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.user_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'student');
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.subject_role AS ENUM ('teacher', 'student');
CREATE TYPE public.message_status AS ENUM ('published', 'blocked', 'deleted', 'pending_review');
CREATE TYPE public.announcement_priority AS ENUM ('normal', 'important', 'urgent');
CREATE TYPE public.announcement_target_type AS ENUM ('university', 'class', 'semester', 'subject');
CREATE TYPE public.submission_status AS ENUM ('pending', 'submitted', 'late', 'graded', 'returned');
CREATE TYPE public.notification_type AS ENUM (
    'announcement', 'message_mention', 'assignment_created',
    'assignment_due', 'submission_graded', 'submission_received',
    'moderation_warning', 'report_update', 'system'
);
CREATE TYPE public.report_category AS ENUM (
    'abuse', 'bullying', 'harassment', 'threat',
    'hate_speech', 'sexual_content', 'spam', 'other'
);
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE public.moderation_action AS ENUM (
    'warning', 'message_blocked', 'slow_mode', 'restricted', 'suspended'
);
CREATE TYPE public.moderation_status AS ENUM ('active', 'slow_mode', 'restricted', 'suspended');

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 2. SCHOOLS
-- ============================================
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    address TEXT,
    settings JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. SCHOOL MEMBERSHIPS
-- ============================================
CREATE TABLE public.university_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL CHECK (role IN ('school_admin', 'teacher', 'student')),
    status member_status DEFAULT 'active' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(university_id, user_id, role)
);
CREATE INDEX idx_memberships_user ON public.university_memberships(user_id);
CREATE INDEX idx_memberships_school_role ON public.university_memberships(university_id, role);

-- ============================================
-- 4. ACADEMIC YEARS
-- ============================================
CREATE TABLE public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(university_id, name)
);
CREATE INDEX idx_institutes_university ON public.institutes(university_id);

-- ============================================
-- 5. CLASSES
-- ============================================
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(institute_id, name)
);
CREATE INDEX idx_departments_year ON public.departments(institute_id);
CREATE INDEX idx_departments_university ON public.departments(university_id);

-- ============================================
-- 6. SECTIONS
-- ============================================
CREATE TABLE public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(department_id, name)
);
CREATE INDEX idx_semesters_class ON public.semesters(department_id);

-- ============================================
-- 7. SUBJECTS
-- ============================================
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4F46E5',
    icon TEXT DEFAULT 'book',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(semester_id, name)
);
CREATE INDEX idx_subjects_semester ON public.subjects(semester_id);
CREATE INDEX idx_subjects_university ON public.subjects(university_id);

-- ============================================
-- 8. SUBJECT MEMBERS
-- ============================================
CREATE TABLE public.subject_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role subject_role NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(subject_id, user_id)
);
CREATE INDEX idx_subject_members_user ON public.subject_members(user_id);
CREATE INDEX idx_subject_members_subject_role ON public.subject_members(subject_id, role);

-- ============================================
-- 9. MESSAGES
-- ============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status message_status DEFAULT 'published' NOT NULL,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    edited_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_messages_subject_created ON public.messages(subject_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_reply ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_pinned ON public.messages(subject_id) WHERE is_pinned = TRUE;

-- ============================================
-- 10. MESSAGE REACTIONS
-- ============================================
CREATE TABLE public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX idx_reactions_message ON public.message_reactions(message_id);

-- ============================================
-- 11. MESSAGE ATTACHMENTS
-- ============================================
CREATE TABLE public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_attachments_message ON public.message_attachments(message_id);

-- ============================================
-- 12. MESSAGE READ CURSORS
-- ============================================
CREATE TABLE public.message_read_cursors (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, subject_id)
);

-- ============================================
-- 13. ANNOUNCEMENTS
-- ============================================
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority announcement_priority DEFAULT 'normal' NOT NULL,
    target_type announcement_target_type NOT NULL,
    target_id UUID NOT NULL,
    attachment_path TEXT,
    attachment_name TEXT,
    published_at TIMESTAMPTZ DEFAULT now(),
    scheduled_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_announcements_target ON public.announcements(target_type, target_id, published_at DESC);
CREATE INDEX idx_announcements_university ON public.announcements(university_id, published_at DESC);

-- ============================================
-- 14. ANNOUNCEMENT READS
-- ============================================
CREATE TABLE public.announcement_reads (
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (announcement_id, user_id)
);

-- ============================================
-- 15. MATERIALS
-- ============================================
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    download_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_materials_subject ON public.materials(subject_id, created_at DESC);
CREATE INDEX idx_materials_topic ON public.materials(subject_id, topic);

-- ============================================
-- 16. ASSIGNMENTS
-- ============================================
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    max_marks NUMERIC(6,2),
    due_date TIMESTAMPTZ,
    allow_late_submission BOOLEAN DEFAULT FALSE NOT NULL,
    allow_resubmission BOOLEAN DEFAULT FALSE NOT NULL,
    attachment_path TEXT,
    attachment_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_assignments_subject ON public.assignments(subject_id, due_date DESC);

-- ============================================
-- 17. ASSIGNMENT SUBMISSIONS
-- ============================================
CREATE TABLE public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    status submission_status DEFAULT 'pending' NOT NULL,
    marks NUMERIC(6,2),
    feedback TEXT,
    is_late BOOLEAN DEFAULT FALSE NOT NULL,
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(assignment_id, student_id)
);
CREATE INDEX idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON public.assignment_submissions(student_id);

-- ============================================
-- 18. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- ============================================
-- 19. REPORTS
-- ============================================
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    category report_category NOT NULL,
    description TEXT,
    status report_status DEFAULT 'pending' NOT NULL,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_reports_school_status ON public.reports(university_id, status, created_at DESC);

-- ============================================
-- 20. MODERATION PROFILES
-- ============================================
CREATE TABLE public.moderation_profiles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    active_strikes INT DEFAULT 0 NOT NULL,
    total_violations INT DEFAULT 0 NOT NULL,
    status moderation_status DEFAULT 'active' NOT NULL,
    restriction_expires_at TIMESTAMPTZ,
    last_violation_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, university_id)
);

-- ============================================
-- 21. MODERATION LOGS
-- ============================================
CREATE TABLE public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    action moderation_action NOT NULL,
    reason TEXT NOT NULL,
    message_content TEXT,
    performed_by TEXT NOT NULL DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_mod_logs_university ON public.moderation_logs(university_id, created_at DESC);
CREATE INDEX idx_mod_logs_user ON public.moderation_logs(user_id);

-- ============================================
-- 22. AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    university_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_audit_university ON public.audit_logs(university_id, created_at DESC);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);

-- ============================================
-- TRIGGERS: Auto-create profile on auth.users insert
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER moderation_profiles_updated_at
  BEFORE UPDATE ON public.moderation_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Enable Realtime for key tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  studchat — MASTER DATABASE SETUP (Fresh Install)          ║
-- ║  Run this ONCE in Supabase SQL Editor to set up everything ║
-- ║  ⚠️  This DROPS all existing studchat tables first!        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ============================================
-- PHASE 0: NUKE EVERYTHING (clean slate)
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS universities_updated_at ON public.universities;
DROP TRIGGER IF EXISTS assignments_updated_at ON public.assignments;
DROP TRIGGER IF EXISTS submissions_updated_at ON public.assignment_submissions;
DROP TRIGGER IF EXISTS moderation_profiles_updated_at ON public.moderation_profiles;
DROP TRIGGER IF EXISTS ensure_profile_security_insert ON public.profiles;
DROP TRIGGER IF EXISTS ensure_profile_security ON public.profiles;
DROP TRIGGER IF EXISTS ensure_submission_security_insert ON public.assignment_submissions;
DROP TRIGGER IF EXISTS ensure_submission_security ON public.assignment_submissions;
DROP TRIGGER IF EXISTS ensure_message_security_insert ON public.messages;
DROP TRIGGER IF EXISTS ensure_message_security ON public.messages;

-- Drop all tables (CASCADE handles foreign keys, policies, indexes)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.moderation_logs CASCADE;
DROP TABLE IF EXISTS public.moderation_profiles CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.announcement_reads CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.message_read_cursors CASCADE;
DROP TABLE IF EXISTS public.message_attachments CASCADE;
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.subject_members CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.semesters CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.institutes CASCADE;
DROP TABLE IF EXISTS public.university_memberships CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Also drop old names in case they exist
DROP TABLE IF EXISTS public.school_memberships CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.academic_years CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.has_school_role(UUID, public.user_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_school_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_subject_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_subject_teacher(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_any_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.protect_profile_roles() CASCADE;
DROP FUNCTION IF EXISTS public.protect_submission_grades() CASCADE;
DROP FUNCTION IF EXISTS public.protect_message_status() CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.member_status CASCADE;
DROP TYPE IF EXISTS public.subject_role CASCADE;
DROP TYPE IF EXISTS public.message_status CASCADE;
DROP TYPE IF EXISTS public.announcement_priority CASCADE;
DROP TYPE IF EXISTS public.announcement_target_type CASCADE;
DROP TYPE IF EXISTS public.submission_status CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.report_category CASCADE;
DROP TYPE IF EXISTS public.report_status CASCADE;
DROP TYPE IF EXISTS public.moderation_action CASCADE;
DROP TYPE IF EXISTS public.moderation_status CASCADE;

-- Drop storage policies (they reference storage.objects, not our tables)
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read materials." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload materials." ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their uploaded materials." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read assignments." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload assignments." ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their uploaded assignments." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read submissions." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload submissions." ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their uploaded submissions." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read attachments." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments." ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their uploaded attachments." ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own materials." ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own assignments." ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own submissions." ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own attachments." ON storage.objects;

-- Delete storage buckets
DELETE FROM storage.buckets WHERE id IN ('avatars', 'materials', 'assignments', 'submissions', 'attachments');


-- ============================================
-- PHASE 1: ENUMS (final state — no super_admin/school_admin)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.user_role AS ENUM ('teacher_admin', 'student_admin', 'teacher', 'student');
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.subject_role AS ENUM ('teacher', 'student');
CREATE TYPE public.message_status AS ENUM ('published', 'blocked', 'deleted', 'pending_review');
CREATE TYPE public.announcement_priority AS ENUM ('normal', 'important', 'urgent');
CREATE TYPE public.announcement_target_type AS ENUM ('university', 'department', 'semester', 'subject');
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
-- PHASE 2: TABLES (University architecture)
-- ============================================

-- 1. Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Universities
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

-- 3. University Memberships
CREATE TABLE public.university_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL CHECK (role IN ('teacher_admin', 'student_admin', 'teacher', 'student')),
    status member_status DEFAULT 'active' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(university_id, user_id, role)
);
CREATE INDEX idx_memberships_user ON public.university_memberships(user_id);
CREATE INDEX idx_memberships_university_role ON public.university_memberships(university_id, role);

-- 4. Institutes
CREATE TABLE public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(university_id, name)
);
CREATE INDEX idx_institutes_university ON public.institutes(university_id);

-- 5. Departments
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(institute_id, name)
);
CREATE INDEX idx_departments_institute ON public.departments(institute_id);
CREATE INDEX idx_departments_university ON public.departments(university_id);

-- 6. Semesters
CREATE TABLE public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(department_id, name)
);
CREATE INDEX idx_semesters_department ON public.semesters(department_id);

-- 7. Subjects
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

-- 8. Subject Members
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

-- 9. Messages
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

-- 10. Message Reactions
CREATE TABLE public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX idx_reactions_message ON public.message_reactions(message_id);

-- 11. Message Attachments
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

-- 12. Message Read Cursors
CREATE TABLE public.message_read_cursors (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, subject_id)
);

-- 13. Announcements
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

-- 14. Announcement Reads
CREATE TABLE public.announcement_reads (
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (announcement_id, user_id)
);

-- 15. Materials
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

-- 16. Assignments
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

-- 17. Assignment Submissions
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

-- 18. Notifications
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

-- 19. Reports
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
CREATE INDEX idx_reports_university_status ON public.reports(university_id, status, created_at DESC);

-- 20. Moderation Profiles
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

-- 21. Moderation Logs
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

-- 22. Audit Logs
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
-- PHASE 3: TRIGGERS
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

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER universities_updated_at BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER moderation_profiles_updated_at BEFORE UPDATE ON public.moderation_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================
-- PHASE 4: HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin(p_university_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.university_memberships
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND role IN ('teacher_admin', 'student_admin')
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_university_role(p_university_id UUID, p_role user_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.university_memberships
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND role = p_role
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_university_member(p_university_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.university_memberships
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_subject_member(p_subject_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subject_members
    WHERE subject_id = p_subject_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_subject_teacher(p_subject_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subject_members
    WHERE subject_id = p_subject_id
      AND user_id = auth.uid()
      AND role = 'teacher'
  );
$$;


-- ============================================
-- PHASE 5: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ============================================
-- PHASE 6: RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view own profile and university members" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.university_memberships m1
    JOIN public.university_memberships m2 ON m1.university_id = m2.university_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
  )
);
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Universities
CREATE POLICY "University members can view university" ON public.universities
FOR SELECT USING (is_university_member(id));
CREATE POLICY "Admins can update university" ON public.universities
FOR UPDATE USING (is_any_admin(id));

-- University Memberships
CREATE POLICY "University members can view memberships" ON public.university_memberships
FOR SELECT USING (is_university_member(university_id));
CREATE POLICY "Admins can manage memberships" ON public.university_memberships
FOR ALL USING (is_any_admin(university_id));

-- Institutes
CREATE POLICY "University members can view institutes" ON public.institutes
FOR SELECT USING (is_university_member(university_id));
CREATE POLICY "Admins can manage institutes" ON public.institutes
FOR ALL USING (is_any_admin(university_id));

-- Departments
CREATE POLICY "University members can view departments" ON public.departments
FOR SELECT USING (is_university_member(university_id));
CREATE POLICY "Admins can manage departments" ON public.departments
FOR ALL USING (is_any_admin(university_id));

-- Semesters
CREATE POLICY "University members can view semesters" ON public.semesters
FOR SELECT USING (is_university_member(university_id));
CREATE POLICY "Admins can manage semesters" ON public.semesters
FOR ALL USING (is_any_admin(university_id));

-- Subjects
CREATE POLICY "University members can view subjects" ON public.subjects
FOR SELECT USING (is_university_member(university_id));
CREATE POLICY "Admins can manage subjects" ON public.subjects
FOR ALL USING (is_any_admin(university_id));

-- Subject Members
CREATE POLICY "University members can view subject members" ON public.subject_members
FOR SELECT USING (is_university_member((SELECT university_id FROM public.subjects WHERE id = subject_id)));
CREATE POLICY "Admins can manage subject members" ON public.subject_members
FOR ALL USING (is_any_admin((SELECT university_id FROM public.subjects WHERE id = subject_id)));

-- Messages
CREATE POLICY "Subject members can view published messages" ON public.messages
FOR SELECT USING (is_subject_member(subject_id) AND status = 'published');
CREATE POLICY "Subject members can insert messages" ON public.messages
FOR INSERT WITH CHECK (is_subject_member(subject_id) AND auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages
FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON public.messages
FOR DELETE USING (auth.uid() = sender_id);

-- Message Reactions
CREATE POLICY "Subject members can view reactions" ON public.message_reactions
FOR SELECT USING (is_subject_member((SELECT subject_id FROM public.messages WHERE id = message_id)));
CREATE POLICY "Subject members can insert reactions" ON public.message_reactions
FOR INSERT WITH CHECK (is_subject_member((SELECT subject_id FROM public.messages WHERE id = message_id)) AND auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.message_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Message Attachments
CREATE POLICY "Subject members can view attachments" ON public.message_attachments
FOR SELECT USING (is_subject_member((SELECT subject_id FROM public.messages WHERE id = message_id)));
CREATE POLICY "Users can manage own message attachments" ON public.message_attachments
FOR ALL USING (auth.uid() = (SELECT sender_id FROM public.messages WHERE id = message_id));

-- Message Read Cursors
CREATE POLICY "Subject members can view read cursors" ON public.message_read_cursors
FOR SELECT USING (is_subject_member(subject_id));
CREATE POLICY "Users can manage own read cursors" ON public.message_read_cursors
FOR ALL USING (auth.uid() = user_id);

-- Announcements
CREATE POLICY "University members can view announcements" ON public.announcements
FOR SELECT USING (is_university_member(university_id));
CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (is_any_admin(university_id));
CREATE POLICY "Teachers can create announcements for their subjects" ON public.announcements
FOR INSERT WITH CHECK (target_type = 'subject' AND is_subject_teacher(target_id) AND auth.uid() = author_id);
CREATE POLICY "Teachers can update own subject announcements" ON public.announcements
FOR UPDATE USING (target_type = 'subject' AND is_subject_teacher(target_id) AND auth.uid() = author_id);
CREATE POLICY "Teachers can delete own subject announcements" ON public.announcements
FOR DELETE USING (target_type = 'subject' AND is_subject_teacher(target_id) AND auth.uid() = author_id);

-- Announcement Reads
CREATE POLICY "Users can view own announcement reads" ON public.announcement_reads
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own announcement reads" ON public.announcement_reads
FOR ALL USING (auth.uid() = user_id);

-- Materials
CREATE POLICY "Subject members can view materials" ON public.materials
FOR SELECT USING (is_subject_member(subject_id));
CREATE POLICY "Subject teachers can manage materials" ON public.materials
FOR ALL USING (is_subject_teacher(subject_id));

-- Assignments
CREATE POLICY "Subject members can view assignments" ON public.assignments
FOR SELECT USING (is_subject_member(subject_id));
CREATE POLICY "Subject teachers can manage assignments" ON public.assignments
FOR ALL USING (is_subject_teacher(subject_id));

-- Assignment Submissions
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions
FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Subject teachers can view submissions" ON public.assignment_submissions
FOR SELECT USING (is_subject_teacher((SELECT subject_id FROM public.assignments WHERE id = assignment_id)));
CREATE POLICY "Students can insert own submissions" ON public.assignment_submissions
FOR INSERT WITH CHECK (
  auth.uid() = student_id AND
  is_subject_member((SELECT subject_id FROM public.assignments WHERE id = assignment_id))
);
CREATE POLICY "Students can update own submissions" ON public.assignment_submissions
FOR UPDATE USING (
  auth.uid() = student_id AND
  is_subject_member((SELECT subject_id FROM public.assignments WHERE id = assignment_id))
);
CREATE POLICY "Students can delete own submissions" ON public.assignment_submissions
FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "Subject teachers can evaluate submissions" ON public.assignment_submissions
FOR UPDATE USING (is_subject_teacher((SELECT subject_id FROM public.assignments WHERE id = assignment_id)));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "University members can insert reports" ON public.reports
FOR INSERT WITH CHECK (is_university_member(university_id));
CREATE POLICY "Admins can view reports" ON public.reports
FOR SELECT USING (is_any_admin(university_id));
CREATE POLICY "Admins can update reports" ON public.reports
FOR UPDATE USING (is_any_admin(university_id));

-- Moderation Profiles
CREATE POLICY "Users can view own moderation profile" ON public.moderation_profiles
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage moderation profiles" ON public.moderation_profiles
FOR ALL USING (is_any_admin(university_id));

-- Moderation Logs
CREATE POLICY "Admins can view moderation logs" ON public.moderation_logs
FOR SELECT USING (is_any_admin(university_id));

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (is_any_admin(university_id));


-- ============================================
-- PHASE 7: SECURITY TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_submission_grades() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.marks IS NOT NULL OR NEW.status != 'pending' OR NEW.feedback IS NOT NULL OR NEW.graded_by IS NOT NULL THEN
      IF NOT (auth.role() = 'service_role' OR public.is_subject_teacher((SELECT subject_id FROM public.assignments WHERE id = NEW.assignment_id))) THEN
        RAISE EXCEPTION 'Unauthorized to set grading information on insert';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.marks IS DISTINCT FROM OLD.marks
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.graded_by IS DISTINCT FROM OLD.graded_by THEN
      IF NOT (auth.role() = 'service_role' OR public.is_subject_teacher((SELECT subject_id FROM public.assignments WHERE id = NEW.assignment_id))) THEN
        RAISE EXCEPTION 'Unauthorized to modify grading information';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ensure_submission_security_insert BEFORE INSERT ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_grades();
CREATE TRIGGER ensure_submission_security BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_grades();

CREATE OR REPLACE FUNCTION public.protect_message_status() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status != 'published' THEN
       IF NOT (auth.role() = 'service_role' OR public.is_any_admin((SELECT university_id FROM public.subjects WHERE id = NEW.subject_id))) THEN
         RAISE EXCEPTION 'Unauthorized to set message status on insert';
       END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (auth.role() = 'service_role' OR public.is_any_admin((SELECT university_id FROM public.subjects WHERE id = NEW.subject_id))) THEN
        RAISE EXCEPTION 'Unauthorized to modify message status';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ensure_message_security_insert BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_status();
CREATE TRIGGER ensure_message_security BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_status();


-- ============================================
-- PHASE 8: STORAGE BUCKETS & POLICIES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('materials', 'materials', false, 26214400, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'video/mp4', 'text/plain']),
  ('assignments', 'assignments', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain']),
  ('submissions', 'submissions', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain', 'application/zip']),
  ('attachments', 'attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Avatars (public read)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatars." ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own avatars." ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Private buckets (owner-only read, server generates signed URLs for others)
CREATE POLICY "Users can read their own materials." ON storage.objects
FOR SELECT USING (bucket_id = 'materials' AND auth.uid() = owner);
CREATE POLICY "Authenticated users can upload materials." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');
CREATE POLICY "Users can manage their uploaded materials." ON storage.objects
FOR ALL USING (bucket_id = 'materials' AND auth.uid() = owner);

CREATE POLICY "Users can read their own assignments." ON storage.objects
FOR SELECT USING (bucket_id = 'assignments' AND auth.uid() = owner);
CREATE POLICY "Authenticated users can upload assignments." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can manage their uploaded assignments." ON storage.objects
FOR ALL USING (bucket_id = 'assignments' AND auth.uid() = owner);

CREATE POLICY "Users can read their own submissions." ON storage.objects
FOR SELECT USING (bucket_id = 'submissions' AND auth.uid() = owner);
CREATE POLICY "Authenticated users can upload submissions." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');
CREATE POLICY "Users can manage their uploaded submissions." ON storage.objects
FOR ALL USING (bucket_id = 'submissions' AND auth.uid() = owner);

CREATE POLICY "Users can read their own attachments." ON storage.objects
FOR SELECT USING (bucket_id = 'attachments' AND auth.uid() = owner);
CREATE POLICY "Authenticated users can upload attachments." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can manage their uploaded attachments." ON storage.objects
FOR ALL USING (bucket_id = 'attachments' AND auth.uid() = owner);


-- ============================================
-- PHASE 9: REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;


-- ============================================
-- ✅ DONE! studchat database is ready.
-- ============================================

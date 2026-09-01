-- ============================================
-- studchat Database Schema
-- Migration 002: RLS Policies
-- ============================================

-- ============================================
-- 1. Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.has_school_role(p_university_id UUID, p_role user_role)
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

CREATE OR REPLACE FUNCTION public.is_school_member(p_university_id UUID)
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
-- 2. Enable RLS
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
-- 3. RLS Policies
-- ============================================

-- Super admin policy for all tables
CREATE POLICY super_admin_all ON public.profiles FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.universities FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.university_memberships FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.institutes FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.departments FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.semesters FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.subjects FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.subject_members FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.messages FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.message_reactions FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.message_attachments FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.message_read_cursors FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.announcements FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.announcement_reads FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.materials FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.assignments FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.assignment_submissions FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.notifications FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.reports FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.moderation_profiles FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.moderation_logs FOR ALL USING (is_super_admin());
CREATE POLICY super_admin_all ON public.audit_logs FOR ALL USING (is_super_admin());


-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);


-- Universitys
CREATE POLICY "University members can view university" ON public.universities
FOR SELECT USING (is_school_member(id));

CREATE POLICY "University admins can update university" ON public.universities
FOR UPDATE USING (has_school_role(id, 'school_admin'));


-- University Memberships
CREATE POLICY "University members can view memberships" ON public.university_memberships
FOR SELECT USING (is_school_member(university_id));

CREATE POLICY "University admins can manage memberships" ON public.university_memberships
FOR ALL USING (has_school_role(university_id, 'school_admin'));


-- Academic Years
CREATE POLICY "University members can view academic years" ON public.institutes
FOR SELECT USING (is_school_member(university_id));

CREATE POLICY "University admins can manage academic years" ON public.institutes
FOR ALL USING (has_school_role(university_id, 'school_admin'));


-- Departments
CREATE POLICY "University members can view departments" ON public.departments
FOR SELECT USING (is_school_member(university_id));

CREATE POLICY "University admins can manage departments" ON public.departments
FOR ALL USING (has_school_role(university_id, 'school_admin'));


-- Semesters
CREATE POLICY "University members can view semesters" ON public.semesters
FOR SELECT USING (is_school_member(university_id));

CREATE POLICY "University admins can manage semesters" ON public.semesters
FOR ALL USING (has_school_role(university_id, 'school_admin'));


-- Subjects
CREATE POLICY "University members can view subjects" ON public.subjects
FOR SELECT USING (is_school_member(university_id));

CREATE POLICY "University admins can manage subjects" ON public.subjects
FOR ALL USING (has_school_role(university_id, 'school_admin'));


-- Subject Members
CREATE POLICY "University members can view subject members" ON public.subject_members
FOR SELECT USING (is_school_member((SELECT university_id FROM public.subjects WHERE id = subject_id)));

CREATE POLICY "University admins can manage subject members" ON public.subject_members
FOR ALL USING (has_school_role((SELECT university_id FROM public.subjects WHERE id = subject_id), 'school_admin'));


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
FOR SELECT USING (is_school_member(university_id));

CREATE POLICY "University admins can manage announcements" ON public.announcements
FOR ALL USING (has_school_role(university_id, 'school_admin'));

CREATE POLICY "Teachers can create announcements for their subjects" ON public.announcements
FOR INSERT WITH CHECK (target_type = 'subject' AND is_subject_teacher(target_id) AND auth.uid() = author_id);


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
CREATE POLICY "Users can view own submissions" ON public.assignment_submissions
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Subject teachers can view submissions" ON public.assignment_submissions
FOR SELECT USING (is_subject_teacher((SELECT subject_id FROM public.assignments WHERE id = assignment_id)));

CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Subject teachers can evaluate submissions" ON public.assignment_submissions
FOR UPDATE USING (is_subject_teacher((SELECT subject_id FROM public.assignments WHERE id = assignment_id)));


-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);


-- Reports
CREATE POLICY "University members can insert reports" ON public.reports
FOR INSERT WITH CHECK (is_school_member(university_id));

CREATE POLICY "University admins can view reports" ON public.reports
FOR SELECT USING (has_school_role(university_id, 'school_admin'));

CREATE POLICY "University admins can update reports" ON public.reports
FOR UPDATE USING (has_school_role(university_id, 'school_admin'));


-- Moderation Profiles
CREATE POLICY "Users can view own moderation profile" ON public.moderation_profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "University admins can manage moderation profiles" ON public.moderation_profiles
FOR ALL USING (has_school_role(university_id, 'school_admin'));


-- Moderation Logs
CREATE POLICY "University admins can view moderation logs" ON public.moderation_logs
FOR SELECT USING (has_school_role(university_id, 'school_admin'));


-- Audit Logs
CREATE POLICY "University admins can view audit logs" ON public.audit_logs
FOR SELECT USING (has_school_role(university_id, 'school_admin'));

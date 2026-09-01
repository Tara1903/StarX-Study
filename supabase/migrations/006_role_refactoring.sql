-- ============================================
-- studchat Database Schema
-- Migration 006: Role Refactoring
-- ============================================

-- 1. Rename ENUM values using ALTER TYPE
ALTER TYPE public.user_role RENAME VALUE 'super_admin' TO 'teacher_admin';
ALTER TYPE public.user_role RENAME VALUE 'school_admin' TO 'student_admin';

-- 2. Drop all super_admin_all policies FIRST (they depend on is_super_admin function)
DROP POLICY IF EXISTS super_admin_all ON public.profiles;
DROP POLICY IF EXISTS super_admin_all ON public.schools;
DROP POLICY IF EXISTS super_admin_all ON public.school_memberships;
DROP POLICY IF EXISTS super_admin_all ON public.academic_years;
DROP POLICY IF EXISTS super_admin_all ON public.classes;
DROP POLICY IF EXISTS super_admin_all ON public.sections;
DROP POLICY IF EXISTS super_admin_all ON public.subjects;
DROP POLICY IF EXISTS super_admin_all ON public.subject_members;
DROP POLICY IF EXISTS super_admin_all ON public.messages;
DROP POLICY IF EXISTS super_admin_all ON public.message_reactions;
DROP POLICY IF EXISTS super_admin_all ON public.message_attachments;
DROP POLICY IF EXISTS super_admin_all ON public.message_read_cursors;
DROP POLICY IF EXISTS super_admin_all ON public.announcements;
DROP POLICY IF EXISTS super_admin_all ON public.announcement_reads;
DROP POLICY IF EXISTS super_admin_all ON public.materials;
DROP POLICY IF EXISTS super_admin_all ON public.assignments;
DROP POLICY IF EXISTS super_admin_all ON public.assignment_submissions;
DROP POLICY IF EXISTS super_admin_all ON public.notifications;
DROP POLICY IF EXISTS super_admin_all ON public.reports;
DROP POLICY IF EXISTS super_admin_all ON public.moderation_profiles;
DROP POLICY IF EXISTS super_admin_all ON public.moderation_logs;
DROP POLICY IF EXISTS super_admin_all ON public.audit_logs;

-- 3. NOW safe to drop the function and column
DROP FUNCTION IF EXISTS public.is_super_admin();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_super_admin;

-- 4. Create helper function (uses OLD table names — 007 will rename them later)
CREATE OR REPLACE FUNCTION public.is_any_admin(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_memberships
    WHERE school_id = p_school_id 
      AND user_id = auth.uid() 
      AND role IN ('teacher_admin', 'student_admin')
      AND status = 'active'
  );
$$;

-- 5. Replace old 'school_admin' policies with is_any_admin()
-- school_memberships
DROP POLICY IF EXISTS "School admins can manage memberships" ON public.school_memberships;
CREATE POLICY "Admins can manage memberships" ON public.school_memberships FOR ALL USING (public.is_any_admin(school_id));

-- academic_years
DROP POLICY IF EXISTS "School admins can manage academic years" ON public.academic_years;
CREATE POLICY "Admins can manage academic years" ON public.academic_years FOR ALL USING (public.is_any_admin(school_id));

-- classes
DROP POLICY IF EXISTS "School admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (public.is_any_admin(school_id));

-- sections
DROP POLICY IF EXISTS "School admins can manage sections" ON public.sections;
CREATE POLICY "Admins can manage sections" ON public.sections FOR ALL USING (public.is_any_admin(school_id));

-- subjects
DROP POLICY IF EXISTS "School admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.is_any_admin(school_id));

-- subject_members
DROP POLICY IF EXISTS "School admins can manage subject members" ON public.subject_members;
CREATE POLICY "Admins can manage subject members" ON public.subject_members FOR ALL USING (
  public.is_any_admin((SELECT school_id FROM public.subjects WHERE id = subject_id))
);

-- announcements
DROP POLICY IF EXISTS "School admins can create announcements" ON public.announcements;
CREATE POLICY "Admins can create announcements" ON public.announcements FOR INSERT WITH CHECK (
  public.is_any_admin(school_id) OR public.is_subject_teacher(subject_id)
);

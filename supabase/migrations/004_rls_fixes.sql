-- Migration 004: RLS Security Hardening

-- Protect profiles from privilege escalation
CREATE OR REPLACE FUNCTION public.protect_profile_roles() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_super_admin = TRUE THEN
      IF NOT (auth.role() = 'service_role' OR public.is_super_admin()) THEN
        RAISE EXCEPTION 'Unauthorized to create super admin profile';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      IF NOT (auth.role() = 'service_role' OR public.is_super_admin()) THEN
        RAISE EXCEPTION 'Unauthorized to modify super admin status';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_profile_security_insert ON public.profiles;
CREATE TRIGGER ensure_profile_security_insert BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

DROP TRIGGER IF EXISTS ensure_profile_security ON public.profiles;
CREATE TRIGGER ensure_profile_security BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

-- Prevent forgery on INSERT/UPDATE for submissions
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

DROP TRIGGER IF EXISTS ensure_submission_security_insert ON public.assignment_submissions;
CREATE TRIGGER ensure_submission_security_insert BEFORE INSERT ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_grades();

DROP TRIGGER IF EXISTS ensure_submission_security ON public.assignment_submissions;
CREATE TRIGGER ensure_submission_security BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_grades();

-- Prevent bypass on INSERT/UPDATE for messages
CREATE OR REPLACE FUNCTION public.protect_message_status() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status != 'published' THEN
       IF NOT (auth.role() = 'service_role' OR public.has_school_role((SELECT school_id FROM public.subjects WHERE id = NEW.subject_id), 'school_admin')) THEN
         RAISE EXCEPTION 'Unauthorized to set message status on insert';
       END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (auth.role() = 'service_role' OR public.has_school_role((SELECT school_id FROM public.subjects WHERE id = NEW.subject_id), 'school_admin')) THEN
        RAISE EXCEPTION 'Unauthorized to modify message status';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_message_security_insert ON public.messages;
CREATE TRIGGER ensure_message_security_insert BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_status();

DROP TRIGGER IF EXISTS ensure_message_security ON public.messages;
CREATE TRIGGER ensure_message_security BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_status();

-- Additional RLS Hardening for Assignment Submissions
DROP POLICY IF EXISTS "Students can manage own submissions" ON public.assignment_submissions;

CREATE POLICY "Students can view own submissions" ON public.assignment_submissions
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own submissions" ON public.assignment_submissions
FOR INSERT WITH CHECK (
  auth.uid() = student_id AND 
  public.is_subject_member((SELECT subject_id FROM public.assignments WHERE id = assignment_id))
);

CREATE POLICY "Students can update own submissions" ON public.assignment_submissions
FOR UPDATE USING (
  auth.uid() = student_id AND 
  public.is_subject_member((SELECT subject_id FROM public.assignments WHERE id = assignment_id))
);

CREATE POLICY "Students can delete own submissions" ON public.assignment_submissions
FOR DELETE USING (auth.uid() = student_id);

-- Allow teachers to manage their own announcements
CREATE POLICY "Teachers can update own subject announcements" ON public.announcements
FOR UPDATE USING (target_type = 'subject' AND public.is_subject_teacher(target_id) AND auth.uid() = author_id);

CREATE POLICY "Teachers can delete own subject announcements" ON public.announcements
FOR DELETE USING (target_type = 'subject' AND public.is_subject_teacher(target_id) AND auth.uid() = author_id);

-- Fix public profiles data leak
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile and school members" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.school_memberships m1
    JOIN public.school_memberships m2 ON m1.school_id = m2.school_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
  ) OR
  public.is_super_admin()
);

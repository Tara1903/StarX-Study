-- ============================================
-- Migration 001: Role updates & Invite Codes
-- ============================================

-- 1. Add new role to user_role ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'institute_head' AFTER 'student_admin';

-- 2. Update existing rows to use institute_head instead of teacher_admin or student_admin
UPDATE public.university_memberships
SET role = 'institute_head'
WHERE role IN ('teacher_admin', 'student_admin');

-- 3. Replace is_any_admin with is_institute_head
CREATE OR REPLACE FUNCTION public.is_institute_head(p_university_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.university_memberships
    WHERE university_id = p_university_id
      AND user_id = auth.uid()
      AND role = 'institute_head'
      AND status = 'active'
  );
$$;

-- 4. Update all policies using is_any_admin to use is_institute_head
DROP POLICY IF EXISTS "Admins can update university" ON public.universities;
CREATE POLICY "Admins can update university" ON public.universities
FOR UPDATE USING (is_institute_head(id));

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.university_memberships;
CREATE POLICY "Admins can manage memberships" ON public.university_memberships
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can manage institutes" ON public.institutes;
CREATE POLICY "Admins can manage institutes" ON public.institutes
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments" ON public.departments
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can manage semesters" ON public.semesters;
CREATE POLICY "Admins can manage semesters" ON public.semesters
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can manage subject members" ON public.subject_members;
CREATE POLICY "Admins can manage subject members" ON public.subject_members
FOR ALL USING (is_institute_head((SELECT university_id FROM public.subjects WHERE id = subject_id)));

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports" ON public.reports
FOR SELECT USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
FOR UPDATE USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can manage moderation profiles" ON public.moderation_profiles;
CREATE POLICY "Admins can manage moderation profiles" ON public.moderation_profiles
FOR ALL USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can view moderation logs" ON public.moderation_logs
FOR SELECT USING (is_institute_head(university_id));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (is_institute_head(university_id));

-- 5. Update triggers using is_any_admin
CREATE OR REPLACE FUNCTION public.protect_message_status() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status != 'published' THEN
      IF NOT (auth.role() = 'service_role' OR public.is_institute_head((SELECT university_id FROM public.subjects WHERE id = NEW.subject_id))) THEN
        RAISE EXCEPTION 'Unauthorized to set message status on insert';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (auth.role() = 'service_role' OR public.is_institute_head((SELECT university_id FROM public.subjects WHERE id = NEW.subject_id))) THEN
        RAISE EXCEPTION 'Unauthorized to modify message status';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add onboarding_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' NOT NULL;

-- 7. Create invite_codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    target_role public.user_role NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    max_uses INT DEFAULT 1,
    uses INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS for invite codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view valid invite codes" ON public.invite_codes
FOR SELECT USING (expires_at > now() OR expires_at IS NULL);

CREATE POLICY "Institute heads can manage invite codes" ON public.invite_codes
FOR ALL USING (is_institute_head(university_id));

-- 8. Drop old function
DROP FUNCTION IF EXISTS public.is_any_admin(UUID) CASCADE;

-- 9. RPC for using invite code
CREATE OR REPLACE FUNCTION public.use_invite_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_invite_code RECORD;
  v_existing_member BOOLEAN;
BEGIN
  -- Lock the invite code row
  SELECT * INTO v_invite_code FROM public.invite_codes
  WHERE code = p_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  IF v_invite_code.expires_at IS NOT NULL AND v_invite_code.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has expired');
  END IF;

  IF v_invite_code.max_uses IS NOT NULL AND v_invite_code.uses >= v_invite_code.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has reached its maximum uses');
  END IF;

  -- Check existing membership
  SELECT EXISTS (
    SELECT 1 FROM public.university_memberships 
    WHERE university_id = v_invite_code.university_id AND user_id = p_user_id
  ) INTO v_existing_member;

  IF v_existing_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this university');
  END IF;

  -- Insert membership
  INSERT INTO public.university_memberships (university_id, user_id, role, status)
  VALUES (v_invite_code.university_id, p_user_id, v_invite_code.target_role, 'active');

  -- Update uses
  UPDATE public.invite_codes
  SET uses = uses + 1
  WHERE id = v_invite_code.id;

  RETURN jsonb_build_object('success', true, 'university_id', v_invite_code.university_id, 'role', v_invite_code.target_role);
END;
$$;

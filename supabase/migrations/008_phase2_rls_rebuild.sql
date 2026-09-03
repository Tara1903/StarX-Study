-- ============================================
-- PHASE 2: DATABASE HARDENING & RLS REBUILD
-- ============================================

-- 1. Notifications RLS
-- Since Server Actions now use createClient(), we must allow authenticated users to insert notifications.
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 2. Moderation Logs RLS
-- Users trigger moderation blocks via Server Actions which insert into moderation_logs.
DROP POLICY IF EXISTS "Users can insert their own moderation logs" ON public.moderation_logs;
CREATE POLICY "Users can insert their own moderation logs" ON public.moderation_logs
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 3. Moderation Profiles RLS
-- Users' active strikes are updated when their messages are blocked.
DROP POLICY IF EXISTS "Users can update their own moderation profile" ON public.moderation_profiles;
CREATE POLICY "Users can update their own moderation profile" ON public.moderation_profiles
FOR UPDATE USING (
  auth.uid() = user_id
);
DROP POLICY IF EXISTS "Users can insert their own moderation profile" ON public.moderation_profiles;
CREATE POLICY "Users can insert their own moderation profile" ON public.moderation_profiles
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 4. Messages RLS
-- Ensure messages can only be updated/deleted by the sender, or updated (pinned/soft deleted) by a teacher.
DROP POLICY IF EXISTS "Teachers can manage subject messages" ON public.messages;
CREATE POLICY "Teachers can manage subject messages" ON public.messages
FOR UPDATE USING (
  is_subject_teacher(subject_id)
);

-- 5. Announcements RLS
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements" ON public.announcements
FOR INSERT WITH CHECK (
  is_any_admin(university_id)
);

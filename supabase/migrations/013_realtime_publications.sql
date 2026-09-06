-- ============================================================
-- Migration: 013_realtime_publications.sql
-- Enables real-time synchronization for personal DMs,
-- participants, message reactions, and friends, and configures
-- the attachments storage bucket for direct public read access.
-- ============================================================

-- 1. Safely add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_friends'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_friends;
  END IF;
END $$;

-- 2. Configure attachments storage bucket to public = true
UPDATE storage.buckets
SET public = true
WHERE id = 'attachments';

-- 3. Storage Policies for attachments
DO $$
BEGIN
  -- Recreate public read policy so anyone with the URL can view shared media
  DROP POLICY IF EXISTS "Public can view attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can read attachments." ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload attachments." ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Public can view attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can manage own uploaded attachments" ON storage.objects
FOR ALL USING (
  bucket_id = 'attachments' AND
  auth.uid() = owner
);

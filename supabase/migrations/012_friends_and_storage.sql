-- ============================================================
-- Migration: 012_friends_and_storage.sql
-- Enables distinct Friends concept, friendship relationships,
-- and indexes for communication-first storage and retrieval.
-- ============================================================

-- 1. Create user_friends table
CREATE TABLE IF NOT EXISTS public.user_friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, friend_id),
    CONSTRAINT chk_not_self_friend CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_user_friends_user ON public.user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend ON public.user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_composite ON public.user_friends(user_id, friend_id);

-- 2. Enable RLS on user_friends
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for user_friends
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view friendships involving them" ON public.user_friends;
  DROP POLICY IF EXISTS "Users can add friends" ON public.user_friends;
  DROP POLICY IF EXISTS "Users can remove friends" ON public.user_friends;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view friendships involving them" ON public.user_friends
FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

CREATE POLICY "Users can add friends" ON public.user_friends
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can remove friends" ON public.user_friends
FOR DELETE USING (
  auth.uid() = user_id
);

-- 4. Storage helper indexes on message_attachments and messages
CREATE INDEX IF NOT EXISTS idx_attachments_created ON public.message_attachments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON public.message_attachments(file_type);

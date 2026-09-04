-- ============================================================
-- Migration: 011_conversations_and_wiring.sql
-- Enables canonical personal & subject conversations,
-- conversation participants, and message linkage.
-- ============================================================

-- 1. Create conversations table if not exists
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('subject', 'personal')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_subject ON public.conversations(subject_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);

-- 2. Create conversation_participants table if not exists
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);

-- 3. Add conversation_id to messages
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Allow subject_id to be nullable if conversation_id is present (for personal chats)
ALTER TABLE public.messages
    ALTER COLUMN subject_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- 4. Helper function: is_conversation_participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  );
$$;

-- 5. Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for conversations
DO $$ BEGIN
  DROP POLICY IF EXISTS "Participants and subject members can view conversations" ON public.conversations;
  DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
  DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Participants and subject members can view conversations" ON public.conversations
FOR SELECT USING (
  (type = 'personal' AND is_conversation_participant(id)) OR
  (type = 'subject' AND subject_id IS NOT NULL AND is_subject_member(subject_id))
);

CREATE POLICY "Authenticated users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update conversations" ON public.conversations
FOR UPDATE USING (
  is_conversation_participant(id) OR
  (subject_id IS NOT NULL AND is_subject_teacher(subject_id))
);

-- 7. RLS Policies for conversation_participants
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
  DROP POLICY IF EXISTS "Users can join authorized conversations" ON public.conversation_participants;
  DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
FOR SELECT USING (
  is_conversation_participant(conversation_id) OR
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.subject_id IS NOT NULL
      AND is_subject_member(c.subject_id)
  )
);

CREATE POLICY "Users can join authorized conversations" ON public.conversation_participants
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own participant record" ON public.conversation_participants
FOR UPDATE USING (auth.uid() = user_id);

-- 8. Update messages RLS policy to support both subject chats and personal conversations
DO $$ BEGIN
  DROP POLICY IF EXISTS "Subject members can view published messages" ON public.messages;
  DROP POLICY IF EXISTS "Authorized users can view published messages" ON public.messages;
  DROP POLICY IF EXISTS "Subject members can insert messages" ON public.messages;
  DROP POLICY IF EXISTS "Authorized users can insert messages" ON public.messages;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authorized users can view published messages" ON public.messages
FOR SELECT USING (
  status = 'published' AND (
    (subject_id IS NOT NULL AND is_subject_member(subject_id)) OR
    (conversation_id IS NOT NULL AND is_conversation_participant(conversation_id))
  )
);

CREATE POLICY "Authorized users can insert messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    (subject_id IS NOT NULL AND is_subject_member(subject_id)) OR
    (conversation_id IS NOT NULL AND is_conversation_participant(conversation_id))
  )
);

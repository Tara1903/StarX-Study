-- ============================================
-- Migration: Flagship Profile & Avatar System
-- Adds avatar personalization columns to public.profiles
-- ============================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'initials',
  ADD COLUMN IF NOT EXISTS avatar_preset_id TEXT,
  ADD COLUMN IF NOT EXISTS avatar_emoji TEXT,
  ADD COLUMN IF NOT EXISTS avatar_style TEXT;

-- Verify RLS ensures users can only update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

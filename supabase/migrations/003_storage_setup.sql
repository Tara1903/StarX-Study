-- ============================================
-- EduConnect Database Schema
-- Migration 003: Storage Setup
-- ============================================

-- Insert buckets
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

-- ============================================
-- Storage Policies
-- ============================================

-- Avatars (Public Read, Authenticated Upload)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars." ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own avatars." ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Materials (Authenticated Read, Authenticated Upload)
CREATE POLICY "Authenticated users can read materials." ON storage.objects
FOR SELECT USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload materials." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage their uploaded materials." ON storage.objects
FOR ALL USING (bucket_id = 'materials' AND auth.uid() = owner);

-- Assignments
CREATE POLICY "Authenticated users can read assignments." ON storage.objects
FOR SELECT USING (bucket_id = 'assignments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload assignments." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage their uploaded assignments." ON storage.objects
FOR ALL USING (bucket_id = 'assignments' AND auth.uid() = owner);

-- Submissions
CREATE POLICY "Authenticated users can read submissions." ON storage.objects
FOR SELECT USING (bucket_id = 'submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload submissions." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage their uploaded submissions." ON storage.objects
FOR ALL USING (bucket_id = 'submissions' AND auth.uid() = owner);

-- Attachments
CREATE POLICY "Authenticated users can read attachments." ON storage.objects
FOR SELECT USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload attachments." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage their uploaded attachments." ON storage.objects
FOR ALL USING (bucket_id = 'attachments' AND auth.uid() = owner);

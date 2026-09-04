import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { resolveSubject } from '@/lib/subject-resolver';
import { SubjectAnnouncementsClient } from './subject-announcements-client';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectAnnouncementsPage({ params }: PageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const subject = await resolveSubject(subjectId, supabase);
  if (!subject) {
    notFound();
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('subject_members')
    .select('id')
    .eq('subject_id', subject.uuid)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  let announcements: any[] = [];
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!author_id(id, full_name, avatar_url)
      `)
      .eq('target_type', 'subject')
      .eq('target_id', subject.uuid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      announcements = data;
    }
  } catch (err) {
    console.error('Error fetching subject announcements:', err);
  }

  return (
    <SubjectAnnouncementsClient
      subject={{
        id: subject.id,
        name: subject.name,
        facultyName: subject.facultyName,
      }}
      announcements={announcements}
    />
  );
}

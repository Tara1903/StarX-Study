import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { resolveSubject, getSubjectAnnouncements, isUuid } from '@/lib/subject-resolver';
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

  let announcements: any[] = [];
  if (isUuid(subject.uuid)) {
    try {
      const { data } = await supabase
        .from('announcements')
        .select(`
          *,
          author:author_id(id, full_name, avatar_url)
        `)
        .eq('target_type', 'subject')
        .eq('target_id', subject.uuid)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        announcements = data;
      }
    } catch {}
  }

  if (announcements.length === 0) {
    announcements = getSubjectAnnouncements(subject.id);
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

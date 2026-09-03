import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnnouncementsClient, MainAnnouncement } from './announcements-client';

export default async function GlobalAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let dbAnnouncements: MainAnnouncement[] = [];

  try {
    const { data } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        content,
        priority,
        target_type,
        attachment_name,
        created_at,
        author:author_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && data.length > 0) {
      dbAnnouncements = data.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.priority === 'urgent' ? 'urgent' : a.priority === 'important' ? 'important' : 'general',
        scope: 'IET, SAGE University • ECE Department',
        author: a.author?.full_name || 'Academic Administration',
        authorRole: 'Official Notice',
        date: a.created_at,
        isPinned: a.priority === 'urgent',
        attachmentName: a.attachment_name || undefined,
        commentsCount: 0,
        readByMe: false,
      }));
    }
  } catch {
    // Falls back to initial announcements in AnnouncementsClient
  }

  return <AnnouncementsClient initialData={dbAnnouncements} />;
}

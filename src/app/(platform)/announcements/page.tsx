import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnnouncementsClient, MainAnnouncement } from './announcements-client';
import type { UserRole } from '@/types/database';

export default async function GlobalAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let dbAnnouncements: MainAnnouncement[] = [];
  let userRole: UserRole = 'student';
  let primaryUniversityId = '';
  let authorizedSubjects: { id: string; name: string }[] = [];

  try {
    // 1. Resolve user's authorized institution and subject scopes
    const { data: memberships } = await supabase
      .from('university_memberships')
      .select('role, university_id, university:universities(name)')
      .eq('user_id', user.id);

    const universityIds = (memberships || []).map((m: any) => m.university_id);
    primaryUniversityId = universityIds[0] || '';
    userRole = memberships?.[0]?.role || 'student';

    const rawUni = memberships?.[0]?.university;
    const universityName = (Array.isArray(rawUni) ? rawUni[0]?.name : (rawUni as any)?.name) || 'Academic Institution';

    // Fetch subjects for announcement creation
    if (userRole === 'teacher') {
      const { data: taughtSubjects } = await supabase
        .from('subject_members')
        .select('subject_id, subject:subjects(id, name)')
        .eq('user_id', user.id)
        .eq('role', 'teacher');

      authorizedSubjects = (taughtSubjects || [])
        .map((ts: any) => ({
          id: ts.subject?.id || ts.subject_id,
          name: ts.subject?.name || 'Subject',
        }))
        .filter((s) => Boolean(s.id));
    } else if (userRole === 'institute_head' && primaryUniversityId) {
      const { data: uniSubjects } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('university_id', primaryUniversityId);

      authorizedSubjects = (uniSubjects || []).map((s: any) => ({
        id: s.id,
        name: s.name,
      }));
    }

    const { data: subjectMembers } = await supabase
      .from('subject_members')
      .select('subject_id')
      .eq('user_id', user.id);

    const userSubjectIds = (subjectMembers || []).map((sm: any) => sm.subject_id);

    // 2. Query announcements visible to user's authorized scopes
    let query = supabase
      .from('announcements')
      .select(`
        id,
        title,
        content,
        priority,
        target_type,
        target_id,
        attachment_name,
        created_at,
        author:profiles!author_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (universityIds.length > 0) {
      query = query.in('university_id', universityIds);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Filter by target scope: institution-wide OR user's enrolled subjects
      const filteredData = data.filter((a: any) => {
        if (userRole === 'institute_head') return true;
        if (a.target_type === 'university' || a.target_type === 'department' || a.target_type === 'semester') {
          return true;
        }
        if (a.target_type === 'subject') {
          return userSubjectIds.includes(a.target_id);
        }
        return true;
      });

      dbAnnouncements = filteredData.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.priority === 'urgent' ? 'urgent' : a.priority === 'important' ? 'important' : 'general',
        scope: universityName,
        author: a.author?.full_name || 'Academic Administration',
        authorRole: 'Official Notice',
        date: a.created_at,
        isPinned: a.priority === 'urgent',
        attachmentName: a.attachment_name || undefined,
        commentsCount: 0,
        readByMe: false,
      }));
    }
  } catch (err) {
    console.error('Error fetching global announcements:', err);
  }

  return (
    <AnnouncementsClient 
      initialData={dbAnnouncements} 
      userRole={userRole}
      universityId={primaryUniversityId}
      authorizedSubjects={authorizedSubjects}
    />
  );
}

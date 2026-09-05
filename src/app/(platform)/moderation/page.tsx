import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ModerationClient, ModerationReportItem } from './moderation-client';

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Verify user is institute_head
  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role, university_id, university:universities(name)')
    .eq('user_id', user.id)
    .eq('role', 'institute_head')
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const universityId = membership.university_id;
  const rawUni = membership.university as any;
  const universityName = (Array.isArray(rawUni) ? rawUni[0]?.name : rawUni?.name) || 'Academic Institution';

  let formattedReports: ModerationReportItem[] = [];

  try {
    const { data: dbReports } = await supabase
      .from('reports')
      .select(`
        id,
        category,
        description,
        status,
        resolution_notes,
        created_at,
        resolved_at,
        reporter:profiles!reporter_id(id, full_name, email),
        reported_user:profiles!reported_user_id(id, full_name, email),
        message:messages(id, content)
      `)
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (dbReports) {
      formattedReports = dbReports.map((r: any) => {
        const reporter = Array.isArray(r.reporter) ? r.reporter[0] : r.reporter;
        const reportedUser = Array.isArray(r.reported_user) ? r.reported_user[0] : r.reported_user;
        const message = Array.isArray(r.message) ? r.message[0] : r.message;

        return {
          id: r.id,
          category: r.category,
          description: r.description,
          status: r.status,
          createdAt: r.created_at,
          reporterName: reporter?.full_name || 'Anonymous Reporter',
          reporterEmail: reporter?.email,
          reportedUserName: reportedUser?.full_name || 'Unknown User',
          reportedUserEmail: reportedUser?.email,
          messageContent: message?.content || null,
          resolutionNotes: r.resolution_notes,
          resolvedAt: r.resolved_at,
        };
      });
    }
  } catch (err) {
    console.error('Failed to load moderation reports:', err);
  }

  return (
    <ModerationClient 
      universityName={universityName} 
      reports={formattedReports} 
    />
  );
}

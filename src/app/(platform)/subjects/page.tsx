import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubjectsListClient, SubjectCardData } from './subjects-list-client';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let enrolledSubjects: SubjectCardData[] = [];

  try {
    const { data: dbMemberships, error } = await supabase
      .from('subject_members')
      .select(`
        subject_id,
        role,
        subject:subjects!inner(
          id,
          name,
          color,
          icon,
          description,
          semester:semesters(
            name,
            department:departments(name, code)
          ),
          teachers:subject_members(
            role,
            profile:profiles(id, full_name)
          )
        )
      `)
      .eq('user_id', user.id);

    if (!error && dbMemberships && dbMemberships.length > 0) {
      // For each subject, get real unread count from message_read_cursors
      const subjectIds = dbMemberships.map((m: any) => m.subject.id);
      
      const { data: cursors } = await supabase
        .from('message_read_cursors')
        .select('subject_id, last_read_at')
        .eq('user_id', user.id)
        .in('subject_id', subjectIds);

      const cursorMap = new Map<string, string>();
      cursors?.forEach((c: any) => {
        cursorMap.set(c.subject_id, c.last_read_at);
      });

      // Query unread count for each subject
      const unreadPromises = subjectIds.map(async (subId: string) => {
        const lastReadAt = cursorMap.get(subId);
        let countQuery = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('subject_id', subId)
          .eq('status', 'published');

        if (lastReadAt) {
          countQuery = countQuery.gt('created_at', lastReadAt);
        }

        const { count } = await countQuery;
        return { subId, count: count || 0 };
      });

      const unreadResults = await Promise.all(unreadPromises);
      const unreadCountMap = new Map<string, number>();
      unreadResults.forEach((r) => unreadCountMap.set(r.subId, r.count));

      enrolledSubjects = dbMemberships.map((m: any) => {
        const s = m.subject;
        const teacherMember = Array.isArray(s.teachers)
          ? s.teachers.find((t: any) => t.role === 'teacher')
          : null;
        const facultyName = teacherMember?.profile?.full_name || 'Assigned Faculty';
        const facultyAbb = facultyName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 3)
          .toUpperCase() || 'AF';

        const deptCode = s.semester?.department?.code || 'SUB';

        return {
          id: s.id,
          code: `${deptCode}-${s.name.substring(0, 3).toUpperCase()}`,
          name: s.name,
          shortName: s.name.substring(0, 4),
          facultyName,
          facultyAbb,
          credits: 4,
          color: s.color || '#3B82F6',
          description: s.description || '',
          room: 'Room No. 03',
          icon: s.icon || 'BookOpen',
          type: 'theory' as const,
          unreadCount: unreadCountMap.get(s.id) || 0,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching enrolled subjects:', err);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-8">
      {/* Clean Page Header */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Subjects
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your enrolled subjects
        </p>
      </header>

      {/* Interactive Clean Subjects List */}
      <SubjectsListClient subjects={enrolledSubjects} />
    </div>
  );
}

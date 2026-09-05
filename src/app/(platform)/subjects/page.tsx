import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubjectsListClient, SubjectCardData } from './subjects-list-client';
import type { UserRole } from '@/types/database';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Get user role and university membership
  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role, university_id, university:universities(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  const userRole: UserRole = membership?.role || 'student';
  const universityId = membership?.university_id || '';

  let subjectsData: SubjectCardData[] = [];
  let availableTeachers: { id: string; name: string }[] = [];
  let availableSemesters: { id: string; name: string; deptName: string }[] = [];

  try {
    // ==============================================
    // 1. INSTITUTE HEAD: ALL UNIVERSITY SUBJECTS
    // ==============================================
    if (userRole === 'institute_head' && universityId) {
      const { data: dbSubjects } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          color,
          icon,
          description,
          semester:semesters(
            id,
            name,
            department:departments(name, code)
          ),
          teachers:subject_members(
            id,
            role,
            user_id,
            profile:profiles(id, full_name)
          )
        `)
        .eq('university_id', universityId)
        .order('name', { ascending: true });

      if (dbSubjects && dbSubjects.length > 0) {
        const subjectIds = dbSubjects.map((s: any) => s.id);

        // Count students per subject
        const countPromises = subjectIds.map(async (subId: string) => {
          const { count } = await supabase
            .from('subject_members')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', subId)
            .eq('role', 'student');
          return { subId, count: count || 0 };
        });

        const counts = await Promise.all(countPromises);
        const countMap = new Map(counts.map((c) => [c.subId, c.count]));

        subjectsData = dbSubjects.map((s: any) => {
          const teacherMember = Array.isArray(s.teachers)
            ? s.teachers.find((t: any) => t.role === 'teacher')
            : null;
          const facultyName = teacherMember?.profile?.full_name || 'Unassigned';
          const facultyAbb = facultyName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 3)
            .toUpperCase() || 'UN';
          const deptCode = s.semester?.department?.code || 'SUB';

          return {
            id: s.id,
            code: `${deptCode}`,
            name: s.name,
            shortName: s.name.substring(0, 4),
            facultyName,
            facultyAbb,
            credits: 4,
            color: s.color || '#3B82F6',
            description: s.description || '',
            room: 'Main Campus',
            icon: s.icon || 'BookOpen',
            type: 'theory' as const,
            studentCount: countMap.get(s.id) || 0,
            unreadCount: 0,
            teacherUserId: teacherMember?.user_id || null,
          };
        });
      }

      // Fetch teachers for assignment modal
      const { data: dbTeachers } = await supabase
        .from('university_memberships')
        .select(`
          user_id,
          profile:profiles(id, full_name)
        `)
        .eq('university_id', universityId)
        .eq('role', 'teacher');

      if (dbTeachers) {
        availableTeachers = dbTeachers.map((t: any) => ({
          id: t.user_id,
          name: t.profile?.full_name || 'Faculty Member',
        }));
      }

      // Fetch semesters for subject creation
      const { data: dbSemesters } = await supabase
        .from('semesters')
        .select(`
          id,
          name,
          department:departments(name, code)
        `)
        .eq('university_id', universityId);

      if (dbSemesters) {
        availableSemesters = dbSemesters.map((sem: any) => ({
          id: sem.id,
          name: sem.name,
          deptName: sem.department?.name || 'Academic Dept',
        }));
      }
    } 
    // ==============================================
    // 2. TEACHER: ONLY ASSIGNED SUBJECTS
    // ==============================================
    else if (userRole === 'teacher') {
      const { data: dbMemberships } = await supabase
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
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'teacher');

      if (dbMemberships && dbMemberships.length > 0) {
        const subjectIds = dbMemberships.map((m: any) => m.subject.id);

        // Get unread counts
        const { data: cursors } = await supabase
          .from('message_read_cursors')
          .select('subject_id, last_read_at')
          .eq('user_id', user.id)
          .in('subject_id', subjectIds);

        const cursorMap = new Map<string, string>();
        cursors?.forEach((c: any) => {
          cursorMap.set(c.subject_id, c.last_read_at);
        });

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

        // Get student counts
        const studentCountPromises = subjectIds.map(async (subId: string) => {
          const { count } = await supabase
            .from('subject_members')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', subId)
            .eq('role', 'student');
          return { subId, count: count || 0 };
        });

        const [unreadResults, studentCountResults] = await Promise.all([
          Promise.all(unreadPromises),
          Promise.all(studentCountPromises),
        ]);

        const unreadCountMap = new Map<string, number>();
        unreadResults.forEach((r) => unreadCountMap.set(r.subId, r.count));

        const studentCountMap = new Map<string, number>();
        studentCountResults.forEach((r) => studentCountMap.set(r.subId, r.count));

        subjectsData = dbMemberships.map((m: any) => {
          const s = m.subject;
          const deptCode = s.semester?.department?.code || 'SUB';

          return {
            id: s.id,
            code: `${deptCode}`,
            name: s.name,
            shortName: s.name.substring(0, 4),
            facultyName: 'You (Instructor)',
            facultyAbb: 'YOU',
            credits: 4,
            color: s.color || '#3B82F6',
            description: s.description || '',
            room: 'Assigned Classroom',
            icon: s.icon || 'BookOpen',
            type: 'theory' as const,
            studentCount: studentCountMap.get(s.id) || 0,
            unreadCount: unreadCountMap.get(s.id) || 0,
          };
        });
      }
    } 
    // ==============================================
    // 3. STUDENT: ENROLLED SUBJECTS
    // ==============================================
    else {
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

        subjectsData = dbMemberships.map((m: any) => {
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
            code: `${deptCode}`,
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
    }
  } catch (err) {
    console.error('Error fetching subjects:', err);
  }

  const pageTitle = userRole === 'institute_head'
    ? 'Institution Subjects'
    : userRole === 'teacher'
    ? 'My Subjects'
    : 'Subjects';

  const pageSubtitle = userRole === 'institute_head'
    ? 'Manage academic courses and faculty assignments across your institution'
    : userRole === 'teacher'
    ? 'Courses assigned to you for instruction and coursework management'
    : 'Your enrolled academic subjects';

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-8">
      {/* Clean Page Header */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {pageTitle}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {pageSubtitle}
        </p>
      </header>

      {/* Interactive Clean Subjects List */}
      <SubjectsListClient 
        subjects={subjectsData} 
        userRole={userRole}
        universityId={universityId}
        availableTeachers={availableTeachers}
        availableSemesters={availableSemesters}
      />
    </div>
  );
}

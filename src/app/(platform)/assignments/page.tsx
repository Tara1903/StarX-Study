import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssignmentsPageClient, AssignmentListItem } from './assignments-page-client';
import type { UserRole } from '@/types/database';

export default async function GlobalAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Get role and university
  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role, university_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const userRole: UserRole = membership?.role || 'student';
  const universityId = membership?.university_id || '';

  let displayAssignments: AssignmentListItem[] = [];
  let availableSubjects: { id: string; name: string }[] = [];

  try {
    // ============================================
    // 1. TEACHER: ASSIGNMENTS FOR TAUGHT SUBJECTS
    // ============================================
    if (userRole === 'teacher') {
      const { data: taughtMemberships } = await supabase
        .from('subject_members')
        .select(`
          subject_id,
          subject:subjects!inner(id, name, color)
        `)
        .eq('user_id', user.id)
        .eq('role', 'teacher');

      const taughtSubjectIds = (taughtMemberships || []).map((m: any) => m.subject.id);
      availableSubjects = (taughtMemberships || []).map((m: any) => ({
        id: m.subject.id,
        name: m.subject.name,
      }));

      if (taughtSubjectIds.length > 0) {
        const { data: dbAssignments } = await supabase
          .from('assignments')
          .select(`
            id,
            subject_id,
            title,
            description,
            due_date,
            max_marks,
            subject:subjects(id, name, color),
            submissions:assignment_submissions(id, status, marks)
          `)
          .in('subject_id', taughtSubjectIds)
          .order('due_date', { ascending: true });

        if (dbAssignments) {
          // Count total students enrolled in each subject
          const countPromises = taughtSubjectIds.map(async (sid: string) => {
            const { count } = await supabase
              .from('subject_members')
              .select('id', { count: 'exact', head: true })
              .eq('subject_id', sid)
              .eq('role', 'student');
            return { sid, count: count || 0 };
          });

          const counts = await Promise.all(countPromises);
          const studentCountMap = new Map(counts.map(c => [c.sid, c.count]));

          displayAssignments = dbAssignments.map((a: any) => {
            const totalStudents = studentCountMap.get(a.subject_id) || 0;
            const subs = Array.isArray(a.submissions) ? a.submissions : [];
            const submittedCount = subs.filter((s: any) => s.status === 'submitted' || s.status === 'graded').length;
            const gradedCount = subs.filter((s: any) => s.status === 'graded').length;

            const dueDateObj = a.due_date ? new Date(a.due_date) : null;
            const isUrgent = dueDateObj
              ? dueDateObj.getTime() - Date.now() < 48 * 3600 * 1000 && dueDateObj.getTime() > Date.now()
              : false;

            return {
              id: a.id,
              subjectId: a.subject_id,
              subjectName: a.subject?.name || 'Subject',
              color: a.subject?.color || '#3B82F6',
              title: a.title,
              description: a.description,
              due: dueDateObj ? dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date',
              dueDateRaw: a.due_date,
              status: `${submittedCount}/${totalStudents} turned in`,
              urgent: isUrgent,
              maxMarks: a.max_marks,
              totalStudents,
              submittedCount,
              gradedCount,
            };
          });
        }
      }
    } 
    // ============================================
    // 2. INSTITUTE HEAD: ALL UNIVERSITY ASSIGNMENTS
    // ============================================
    else if (userRole === 'institute_head' && universityId) {
      const { data: uniSubjects } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('university_id', universityId);

      availableSubjects = (uniSubjects || []).map((s: any) => ({ id: s.id, name: s.name }));
      const uniSubjectIds = availableSubjects.map((s) => s.id);

      if (uniSubjectIds.length > 0) {
        const { data: dbAssignments } = await supabase
          .from('assignments')
          .select(`
            id,
            subject_id,
            title,
            description,
            due_date,
            max_marks,
            subject:subjects(id, name, color),
            submissions:assignment_submissions(id, status, marks)
          `)
          .in('subject_id', uniSubjectIds)
          .order('due_date', { ascending: true });

        if (dbAssignments) {
          const countPromises = uniSubjectIds.map(async (sid: string) => {
            const { count } = await supabase
              .from('subject_members')
              .select('id', { count: 'exact', head: true })
              .eq('subject_id', sid)
              .eq('role', 'student');
            return { sid, count: count || 0 };
          });

          const counts = await Promise.all(countPromises);
          const studentCountMap = new Map(counts.map(c => [c.sid, c.count]));

          displayAssignments = dbAssignments.map((a: any) => {
            const totalStudents = studentCountMap.get(a.subject_id) || 0;
            const subs = Array.isArray(a.submissions) ? a.submissions : [];
            const submittedCount = subs.filter((s: any) => s.status === 'submitted' || s.status === 'graded').length;
            const gradedCount = subs.filter((s: any) => s.status === 'graded').length;

            const dueDateObj = a.due_date ? new Date(a.due_date) : null;
            return {
              id: a.id,
              subjectId: a.subject_id,
              subjectName: a.subject?.name || 'Subject',
              color: a.subject?.color || '#3B82F6',
              title: a.title,
              description: a.description,
              due: dueDateObj ? dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date',
              dueDateRaw: a.due_date,
              status: `${submittedCount}/${totalStudents} turned in`,
              urgent: false,
              maxMarks: a.max_marks,
              totalStudents,
              submittedCount,
              gradedCount,
            };
          });
        }
      }
    } 
    // ============================================
    // 3. STUDENT: ENROLLED COURSEWORK
    // ============================================
    else {
      const { data: dbMemberships } = await supabase
        .from('subject_members')
        .select('subject_id')
        .eq('user_id', user.id);

      const userSubjectIds = (dbMemberships || []).map((m: any) => m.subject_id);

      if (userSubjectIds.length > 0) {
        const { data: dbAssignments } = await supabase
          .from('assignments')
          .select(`
            id,
            subject_id,
            title,
            description,
            due_date,
            max_marks,
            subject:subjects(id, name, color),
            submission:assignment_submissions(
              id,
              status,
              marks,
              submitted_at
            )
          `)
          .in('subject_id', userSubjectIds)
          .order('due_date', { ascending: true });

        if (dbAssignments) {
          displayAssignments = dbAssignments.map((a: any) => {
            const sub = Array.isArray(a.submission) && a.submission.length > 0 ? a.submission[0] : null;
            let statusText = 'Pending';
            if (sub) {
              if (sub.status === 'graded') {
                statusText = sub.marks !== null ? `Graded (${sub.marks}/${a.max_marks || 100})` : 'Graded';
              } else if (sub.status === 'submitted') {
                statusText = 'Submitted';
              }
            }

            const dueDateObj = a.due_date ? new Date(a.due_date) : null;
            const isUrgent = dueDateObj ? (dueDateObj.getTime() - Date.now() < 48 * 3600 * 1000 && dueDateObj.getTime() > Date.now()) : false;

            return {
              id: a.id,
              subjectId: a.subject_id,
              subjectName: a.subject?.name || 'Subject Coursework',
              color: a.subject?.color || '#3B82F6',
              title: a.title,
              description: a.description,
              due: dueDateObj ? dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date',
              dueDateRaw: a.due_date,
              status: statusText,
              urgent: isUrgent,
              maxMarks: a.max_marks,
              myMarks: sub?.marks,
            };
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching assignments:', err);
  }

  return (
    <AssignmentsPageClient
      assignments={displayAssignments}
      userRole={userRole}
      availableSubjects={availableSubjects}
    />
  );
}

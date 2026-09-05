import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { resolveSubject } from '@/lib/subject-resolver';
import { AssignmentsPageClient, AssignmentListItem } from '@/app/(platform)/assignments/assignments-page-client';
import type { UserRole } from '@/types/database';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectAssignmentsPage({ params }: PageProps) {
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

  // Authorization check
  const { data: membership } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', subject.uuid)
    .eq('user_id', user.id)
    .maybeSingle();

  let isInstituteHead = false;
  if (!membership) {
    if (subject.universityId) {
      const { data: uniMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.universityId)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();

      if (uniMember) isInstituteHead = true;
    }
    if (!isInstituteHead) {
      notFound();
    }
  }

  const userRole: UserRole = isInstituteHead ? 'institute_head' : (membership?.role as any) || 'student';
  const isTeacherOrHead = userRole === 'teacher' || userRole === 'institute_head';

  let assignments: AssignmentListItem[] = [];

  try {
    const [{ data: dbAssignments }, { count: studentCount }] = await Promise.all([
      supabase
        .from('assignments')
        .select(`
          id,
          subject_id,
          title,
          description,
          due_date,
          max_marks,
          submissions:assignment_submissions(
            id,
            student_id,
            status,
            marks,
            submitted_at
          )
        `)
        .eq('subject_id', subject.uuid)
        .order('due_date', { ascending: true }),
      supabase
        .from('subject_members')
        .select('id', { count: 'exact', head: true })
        .eq('subject_id', subject.uuid)
        .eq('role', 'student'),
    ]);

    const totalStudents = studentCount || 0;

    if (dbAssignments) {
      assignments = dbAssignments.map((a: any) => {
        const subs = Array.isArray(a.submissions) ? a.submissions : [];
        const mySub = subs.find((s: any) => s.student_id === user.id);
        const submittedCount = subs.filter((s: any) => s.status === 'submitted' || s.status === 'graded').length;
        const gradedCount = subs.filter((s: any) => s.status === 'graded').length;

        let statusText = 'Pending';
        if (isTeacherOrHead) {
          statusText = `${submittedCount}/${totalStudents} turned in`;
        } else if (mySub) {
          if (mySub.status === 'graded') {
            statusText = mySub.marks !== null ? `Graded (${mySub.marks}/${a.max_marks || 100})` : 'Graded';
          } else if (mySub.status === 'submitted') {
            statusText = 'Submitted';
          }
        }

        const dueDateObj = a.due_date ? new Date(a.due_date) : null;
        const isUrgent = dueDateObj
          ? dueDateObj.getTime() - Date.now() < 48 * 3600 * 1000 && dueDateObj.getTime() > Date.now()
          : false;

        return {
          id: a.id,
          subjectId: subject.id,
          subjectName: subject.name,
          color: subject.color || '#3B82F6',
          title: a.title,
          description: a.description,
          due: dueDateObj ? dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date',
          dueDateRaw: a.due_date,
          status: statusText,
          urgent: isUrgent,
          maxMarks: a.max_marks,
          totalStudents,
          submittedCount,
          gradedCount,
          myMarks: mySub?.marks,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching subject assignments:', err);
  }

  return (
    <div className="space-y-4">
      {/* Subject Breadcrumb Header */}
      <div className="p-4 sm:p-6 lg:px-10 lg:pt-8 max-w-5xl mx-auto flex items-center justify-between pb-0">
        <Link
          href={`/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {subject.name}</span>
        </Link>

        <Link
          href={`/chat/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Subject Chat</span>
        </Link>
      </div>

      <AssignmentsPageClient
        assignments={assignments}
        userRole={userRole}
        availableSubjects={[{ id: subject.uuid, name: subject.name }]}
      />
    </div>
  );
}

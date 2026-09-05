import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { resolveSubject } from '@/lib/subject-resolver';
import { AssignmentDetailClient, StudentSubmissionItem } from './assignment-detail-client';

interface PageProps {
  params: Promise<{ subjectId: string; assignmentId: string }>;
}

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { subjectId, assignmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resolved = await resolveSubject(subjectId, supabase);
  const targetSubjectUuid = resolved?.uuid || subjectId;

  // Authorization check: Verify user is a member of this subject OR institute head
  const { data: membership } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', targetSubjectUuid)
    .eq('user_id', user.id)
    .maybeSingle();

  let isInstituteHead = false;
  if (!membership) {
    if (resolved?.universityId) {
      const { data: uniMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', resolved.universityId)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();

      if (uniMember) {
        isInstituteHead = true;
      }
    }
    if (!isInstituteHead) {
      notFound();
    }
  }

  const isTeacher = membership?.role === 'teacher' || isInstituteHead;

  // Fetch assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .maybeSingle();

  if (!assignment) {
    notFound();
  }

  let totalStudents = 0;
  let submissions: StudentSubmissionItem[] = [];
  let mySubmission: StudentSubmissionItem | null = null;

  if (isTeacher) {
    // 1. Fetch all students enrolled in this subject
    const { data: enrolledStudents } = await supabase
      .from('subject_members')
      .select(`
        user_id,
        profile:profiles(id, full_name, email, avatar_url)
      `)
      .eq('subject_id', targetSubjectUuid)
      .eq('role', 'student');

    totalStudents = enrolledStudents?.length || 0;

    // 2. Fetch all submissions for this assignment
    const { data: dbSubmissions } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId);

    const subMap = new Map<string, any>();
    dbSubmissions?.forEach((s: any) => subMap.set(s.student_id, s));

    // Combine roster with submissions
    submissions = (enrolledStudents || []).map((es: any) => {
      const sub = subMap.get(es.user_id);
      return {
        id: sub?.id || '',
        studentId: es.user_id,
        studentName: es.profile?.full_name || 'Student',
        studentEmail: es.profile?.email || '',
        avatarUrl: es.profile?.avatar_url,
        status: sub?.status || 'pending',
        content: sub?.content || null,
        filePath: sub?.file_path || null,
        fileName: sub?.file_name || null,
        submittedAt: sub?.submitted_at || null,
        marks: sub?.marks,
        feedback: sub?.feedback || null,
        gradedAt: sub?.graded_at || null,
      };
    });
  } else {
    // Student: Fetch only their own submission
    const { data: sub } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (sub) {
      mySubmission = {
        id: sub.id,
        studentId: user.id,
        studentName: 'You',
        studentEmail: user.email || '',
        status: sub.status,
        content: sub.content,
        filePath: sub.file_path,
        fileName: sub.file_name,
        submittedAt: sub.submitted_at,
        marks: sub.marks,
        feedback: sub.feedback,
        gradedAt: sub.graded_at,
      };
    }
  }

  return (
    <AssignmentDetailClient
      subjectId={resolved?.id || subjectId}
      subjectName={resolved?.name || 'Subject Coursework'}
      assignment={{
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        maxMarks: assignment.max_marks,
        dueDate: assignment.due_date,
      }}
      isTeacher={isTeacher}
      totalStudents={totalStudents}
      submissions={submissions}
      mySubmission={mySubmission}
    />
  );
}

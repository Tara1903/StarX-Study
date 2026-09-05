'use server';

import { createClient } from '@/lib/supabase/server';
import { createAssignmentSchema, submitAssignmentSchema, gradeSubmissionSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function createAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries()) as any;
  if (data.max_marks) data.max_marks = Number(data.max_marks);
  if (data.allow_late_submission !== undefined) data.allow_late_submission = data.allow_late_submission === 'true' || data.allow_late_submission === true;
  if (data.allow_resubmission !== undefined) data.allow_resubmission = data.allow_resubmission === 'true' || data.allow_resubmission === true;

  const parsed = createAssignmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid data' };

  const { subject_id, title, description, instructions, due_date, max_marks } = parsed.data;

  // Validate teacher or institute head
  const { data: member } = await supabase.from('subject_members')
    .select('role')
    .eq('subject_id', subject_id)
    .eq('user_id', user.id)
    .maybeSingle();

  let isAuthorized = member?.role === 'teacher';

  if (!isAuthorized) {
    const { data: subject } = await supabase
      .from('subjects')
      .select('university_id')
      .eq('id', subject_id)
      .maybeSingle();

    if (subject) {
      const { data: uniMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.university_id)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();

      if (uniMember) isAuthorized = true;
    }
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized: You do not have permission to create assignments for this subject' };

  const { data: assignment, error } = await supabase.from('assignments').insert({
    subject_id,
    created_by: user.id,
    title,
    description,
    due_date,
    max_marks
  }).select().single();

  if (error) return { success: false, error: error.message };

  // Notify students
  const { data: students } = await supabase.from('subject_members').select('user_id').eq('subject_id', subject_id).eq('role', 'student');
  if (students && students.length > 0) {
    const notifications = students.map(s => ({
      user_id: s.user_id,
      type: 'assignment_created',
      title: 'New Assignment',
      body: `New assignment posted: ${title}`,
      link: `/subjects/${subject_id}/assignments/${assignment.id}`
    }));
    await supabase.from('notifications').insert(notifications);
  }

  revalidatePath(`/subjects/${subject_id}`);
  return { success: true, data: assignment };
}

export async function submitAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries());
  const parsed = submitAssignmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  // Wait, does submitAssignmentSchema have attachments? 
  // We'll leave it out of insert if it doesn't match the DB
  const { assignment_id, content } = parsed.data;
  
  // Note: For file uploads, we'd need file_path and file_name, handled separately

  const { data: assignment } = await supabase.from('assignments').select('subject_id, due_date').eq('id', assignment_id).single();
  if (!assignment) return { success: false, error: 'Not found' };

  if (new Date(assignment.due_date) < new Date()) {
    return { success: false, error: 'Deadline has passed' };
  }

  const { data: member } = await supabase.from('subject_members')
    .select('role')
    .eq('subject_id', assignment.subject_id)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'student') return { success: false, error: 'Unauthorized' };

  const { data: submission, error } = await supabase.from('assignment_submissions').upsert({
    assignment_id,
    student_id: user.id,
    content,
    status: 'submitted',
    submitted_at: new Date().toISOString()
  }).select().single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/subjects/${assignment.subject_id}/assignments/${assignment_id}`);
  return { success: true, data: submission };
}

export async function gradeSubmission(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries()) as any;
  if (data.marks !== undefined && data.marks !== '') data.marks = Number(data.marks);
  if (!data.status) data.status = 'graded';

  const parsed = gradeSubmissionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid data' };

  const { submission_id, marks, feedback } = parsed.data;

  const { data: submission } = await supabase.from('assignment_submissions').select('assignment_id, student_id, assignments(subject_id)').eq('id', submission_id).single() as any;
  if (!submission) return { success: false, error: 'Submission not found' };

  const subjectId = submission.assignments?.subject_id;

  const { data: member } = await supabase.from('subject_members')
    .select('role')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .maybeSingle();

  let isAuthorized = member?.role === 'teacher';

  if (!isAuthorized) {
    const { data: subject } = await supabase
      .from('subjects')
      .select('university_id')
      .eq('id', subjectId)
      .maybeSingle();

    if (subject) {
      const { data: uniMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.university_id)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();

      if (uniMember) isAuthorized = true;
    }
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized: Only the assigned instructor or institute head can grade submissions' };

  const { data: updated, error } = await supabase.from('assignment_submissions').update({
    marks,
    feedback,
    status: 'graded',
    graded_at: new Date().toISOString(),
    graded_by: user.id
  }).eq('id', submission_id).select().single();

  if (error) return { success: false, error: error.message };

  await supabase.from('notifications').insert({
    user_id: submission.student_id,
    type: 'submission_graded',
    title: 'Assignment Graded',
    body: `Your assignment has been graded. Marks: ${marks}`,
    link: `/subjects/${submission.assignments.subject_id}/assignments/${submission.assignment_id}`
  });

  revalidatePath(`/subjects/${submission.assignments.subject_id}/assignments/${submission.assignment_id}`);
  return { success: true, data: updated };
}

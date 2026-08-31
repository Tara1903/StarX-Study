// @ts-nocheck
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAssignmentSchema, submitAssignmentSchema, gradeSubmissionSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function createAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries());
  const parsed = createAssignmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { subject_id, title, description, due_date, max_marks } = parsed.data;

  // Validate teacher
  const { data: member } = await supabase.from('subject_members')
    .select('role')
    .eq('subject_id', subject_id)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'teacher') return { success: false, error: 'Unauthorized' };

  const { data: assignment, error } = await supabase.from('assignments').insert({
    subject_id,
    teacher_id: user.id,
    title,
    description,
    due_date,
    total_marks: max_marks
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
      link: `/assignments/${assignment.id}`
    }));
    await (await createAdminClient()).from('notifications').insert(notifications);
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

  const { assignment_id, content, attachments } = parsed.data;

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
    attachments: attachments || [],
    submitted_at: new Date().toISOString()
  }).select().single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/assignments/${assignment_id}`);
  return { success: true, data: submission };
}

export async function gradeSubmission(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries());
  const parsed = gradeSubmissionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { submission_id, marks, feedback } = parsed.data;

  const { data: submission } = await supabase.from('assignment_submissions').select('assignment_id, student_id, assignments(subject_id)').eq('id', submission_id).single();
  if (!submission) return { success: false, error: 'Not found' };

  const { data: member } = await supabase.from('subject_members')
    .select('role')
    .eq('subject_id', submission.assignments.subject_id)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'teacher') return { success: false, error: 'Unauthorized' };

  const { data: updated, error } = await supabase.from('assignment_submissions').update({
    marks,
    feedback,
    graded_at: new Date().toISOString(),
    grader_id: user.id
  }).eq('id', submission_id).select().single();

  if (error) return { success: false, error: error.message };

  await (await createAdminClient()).from('notifications').insert({
    user_id: submission.student_id,
    type: 'assignment_graded',
    title: 'Assignment Graded',
    body: `Your assignment has been graded. Marks: ${marks}`,
    link: `/assignments/${submission.assignment_id}`
  });

  revalidatePath(`/assignments/${submission.assignment_id}`);
  return { success: true, data: updated };
}


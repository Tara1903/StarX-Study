'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createUniversity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Note: Only global super admins should do this. Check logic depends on implementation.
  

  const name = formData.get('name') as string;
  const { data: university, error } = await supabase.from('universities').insert({ name }).select().single();
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin');
  return { success: true, data: university };
}

export async function inviteUser(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const schoolId = formData.get('schoolId') as string;
  const fullName = formData.get('fullName') as string;

  const { data: member } = await supabase.from('university_memberships')
    .select('role')
    .eq('university_id', schoolId)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'student_admin' && member.role !== 'teacher_admin')) return { success: false, error: 'Unauthorized' };

  const adminClient = await createAdminClient();
  
  // Create user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) return { success: false, error: authError.message };

  const newUser = authData.user;

  // Insert profile and membership
  await adminClient.from('profiles').upsert({ id: newUser.id, full_name: fullName });
  await adminClient.from('university_memberships').insert({ user_id: newUser.id, university_id: schoolId, role });

  revalidatePath('/admin/users');
  return { success: true, data: newUser };
}

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const schoolId = formData.get('schoolId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', schoolId).eq('user_id', user.id).single();
  if (!member || (member.role !== 'student_admin' && member.role !== 'teacher_admin')) return { success: false, error: 'Unauthorized' };

  const { data: cls, error } = await supabase.from('departments').insert({ name, university_id: schoolId }).select().single();
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/departments');
  return { success: true, data: cls };
}

export async function createSemester(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const classId = formData.get('classId') as string;
  const schoolId = formData.get('schoolId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', schoolId).eq('user_id', user.id).single();
  if (!member || (member.role !== 'student_admin' && member.role !== 'teacher_admin')) return { success: false, error: 'Unauthorized' };

  const { data: semester, error } = await supabase.from('semesters').insert({ name, department_id: classId }).select().single();
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/departments');
  return { success: true, data: semester };
}

export async function createSubject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const semesterId = formData.get('semesterId') as string;
  const schoolId = formData.get('schoolId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', schoolId).eq('user_id', user.id).single();
  if (!member || (member.role !== 'student_admin' && member.role !== 'teacher_admin')) return { success: false, error: 'Unauthorized' };

  const { data: subject, error } = await supabase.from('subjects').insert({ name, semester_id: semesterId, university_id: schoolId }).select().single();
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/subjects');
  return { success: true, data: subject };
}

export async function enrollMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const userId = formData.get('userId') as string;
  const subjectId = formData.get('subjectId') as string;
  const role = formData.get('role') as string;
  const schoolId = formData.get('schoolId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', schoolId).eq('user_id', user.id).single();
  if (!member || (member.role !== 'student_admin' && member.role !== 'teacher_admin')) return { success: false, error: 'Unauthorized' };

  const { data: enrollment, error } = await supabase.from('subject_members').insert({ user_id: userId, subject_id: subjectId, role }).select().single();
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/enrollments');
  return { success: true, data: enrollment };
}

export async function resolveReport(reportId: string, action: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: report } = await supabase.from('reports').select('university_id').eq('id', reportId).single();
  if (!report) return { success: false, error: 'Not found' };

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', report.university_id).eq('user_id', user.id).single();
  if (!member || (member.role !== 'student_admin' && member.role !== 'teacher_admin')) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('reports').update({ status: 'resolved', resolution_action: action, resolution_notes: notes, resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', reportId);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/reports');
  return { success: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createUniversity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify platform super admin authorization
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_super_admin')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.is_super_admin === true || profile?.role === 'super_admin';
  if (!isSuperAdmin) {
    return { success: false, error: 'Unauthorized: Only platform administrators can create institutions' };
  }

  const rawName = (formData.get('name') as string) || '';
  const name = rawName.trim();
  if (!name || name.length < 2 || name.length > 100) {
    return { success: false, error: 'Institution name must be between 2 and 100 characters' };
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const { data: university, error } = await supabase.from('universities').insert({ name, slug }).select().single();
  
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
  const universityId = formData.get('universityId') as string;
  const fullName = formData.get('fullName') as string;

  const { data: member } = await supabase.from('university_memberships')
    .select('role')
    .eq('university_id', universityId)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'school_admin' && member.role !== 'super_admin')) return { success: false, error: 'Unauthorized' };

  const adminClient = createAdminClient();
  
  // Create user (requires service role)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) return { success: false, error: authError.message };

  const newUser = authData.user;

  // Insert profile and membership (RLS protects this for normal users, so we use authenticated client where possible, or admin client if skipping triggers)
  await supabase.from('profiles').upsert({ id: newUser.id, full_name: fullName, email });
  await supabase.from('university_memberships').insert({ user_id: newUser.id, university_id: universityId, role });

  revalidatePath('/admin/users');
  return { success: true, data: newUser };
}

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const universityId = formData.get('universityId') as string;
  const instituteId = formData.get('instituteId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', universityId).eq('user_id', user.id).single();
  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  const { data: dept, error } = await supabase.from('departments').insert({ name, university_id: universityId, institute_id: instituteId }).select().single();
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/departments');
  return { success: true, data: dept };
}

export async function createSemester(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const departmentId = formData.get('departmentId') as string;
  const universityId = formData.get('universityId') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', universityId).eq('user_id', user.id).single();
  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  const { data: semester, error } = await supabase.from('semesters').insert({ name, department_id: departmentId, university_id: universityId, start_date: startDate, end_date: endDate }).select().single();
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
  const universityId = formData.get('universityId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', universityId).eq('user_id', user.id).single();
  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  const { data: subject, error } = await supabase.from('subjects').insert({ name, semester_id: semesterId, university_id: universityId }).select().single();
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
  const universityId = formData.get('universityId') as string;

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', universityId).eq('user_id', user.id).single();
  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

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
  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('reports').update({ 
    status: 'resolved', 
    resolution_notes: `[${action}] ${notes}`, 
    resolved_by: user.id, 
    resolved_at: new Date().toISOString() 
  }).eq('id', reportId);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/moderation');
  revalidatePath('/admin/reports');
  return { success: true };
}

export async function dismissReport(reportId: string, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: report } = await supabase.from('reports').select('university_id').eq('id', reportId).single();
  if (!report) return { success: false, error: 'Not found' };

  const { data: member } = await supabase.from('university_memberships').select('role').eq('university_id', report.university_id).eq('user_id', user.id).single();
  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('reports').update({ 
    status: 'dismissed', 
    resolution_notes: notes ? `[Dismissed] ${notes}` : '[Dismissed] No violation found', 
    resolved_by: user.id, 
    resolved_at: new Date().toISOString() 
  }).eq('id', reportId);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/moderation');
  revalidatePath('/admin/reports');
  return { success: true };
}

export async function assignSubjectTeacher(subjectId: string, teacherId: string, universityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify institute head authorization
  const { data: member } = await supabase
    .from('university_memberships')
    .select('role')
    .eq('university_id', universityId)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  // Verify target user is actually a teacher in the university
  const { data: targetTeacher } = await supabase
    .from('university_memberships')
    .select('role')
    .eq('university_id', universityId)
    .eq('user_id', teacherId)
    .eq('role', 'teacher')
    .single();

  if (!targetTeacher) return { success: false, error: 'Selected user is not a teacher in this institution' };

  // Verify subject belongs to this university
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, university_id')
    .eq('id', subjectId)
    .eq('university_id', universityId)
    .single();

  if (!subject) return { success: false, error: 'Subject not found in your institution' };

  // Remove existing teachers for this subject to assign the new one (or add)
  await supabase
    .from('subject_members')
    .delete()
    .eq('subject_id', subjectId)
    .eq('role', 'teacher');

  const { error } = await supabase
    .from('subject_members')
    .insert({
      subject_id: subjectId,
      user_id: teacherId,
      role: 'teacher',
    });

  if (error) return { success: false, error: error.message };

  // Notify the teacher
  await supabase.from('notifications').insert({
    user_id: teacherId,
    type: 'system',
    title: 'Subject Assigned',
    body: `You have been assigned as the faculty for ${subject.name}.`,
    link: `/subjects/${subjectId}`,
  });

  revalidatePath('/people');
  revalidatePath('/subjects');
  revalidatePath(`/subjects/${subjectId}`);
  return { success: true };
}

export async function enrollSubjectStudent(subjectId: string, studentId: string, universityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('university_memberships')
    .select('role')
    .eq('university_id', universityId)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('subject_members')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('user_id', studentId)
    .maybeSingle();

  if (existing) return { success: false, error: 'Student already enrolled in this subject' };

  const { error } = await supabase
    .from('subject_members')
    .insert({
      subject_id: subjectId,
      user_id: studentId,
      role: 'student',
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/people');
  revalidatePath('/subjects');
  revalidatePath(`/subjects/${subjectId}`);
  return { success: true };
}

export async function removeSubjectMember(subjectId: string, userId: string, universityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('university_memberships')
    .select('role')
    .eq('university_id', universityId)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'institute_head') return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('subject_members')
    .delete()
    .eq('subject_id', subjectId)
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/people');
  revalidatePath('/subjects');
  revalidatePath(`/subjects/${subjectId}`);
  return { success: true };
}


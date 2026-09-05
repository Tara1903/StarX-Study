'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadMaterial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const subjectId = formData.get('subject_id') as string;
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || null;
  const topic = (formData.get('topic') as string) || 'General';
  const fileName = (formData.get('file_name') as string) || `${title.replace(/\s+/g, '_')}.pdf`;
  const fileType = (formData.get('file_type') as string) || 'application/pdf';
  const fileSize = parseInt(formData.get('file_size') as string, 10) || 1024 * 512;
  const storagePath = (formData.get('storage_path') as string) || '#';

  if (!subjectId || !title) {
    return { success: false, error: 'Subject ID and Title are required' };
  }

  // 1. Authorize teacher or institute head
  const { data: member } = await supabase
    .from('subject_members')
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

  if (!isAuthorized) {
    return { success: false, error: 'Unauthorized: You are not authorized to upload materials for this subject' };
  }

  // 2. Insert material
  const { data: material, error } = await supabase
    .from('materials')
    .insert({
      subject_id: subjectId,
      uploaded_by: user.id,
      title,
      description,
      topic,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      storage_path: storagePath,
      download_count: 0,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Notify enrolled students
  const { data: students } = await supabase
    .from('subject_members')
    .select('user_id')
    .eq('subject_id', subjectId)
    .eq('role', 'student');

  if (students && students.length > 0) {
    const notifications = students.map((s: any) => ({
      user_id: s.user_id,
      type: 'system',
      title: 'New Course Material',
      body: `${title} was added to your course materials.`,
      link: `/subjects/${subjectId}/materials`,
    }));
    await supabase.from('notifications').insert(notifications);
  }

  revalidatePath(`/subjects/${subjectId}/materials`);
  revalidatePath(`/subjects/${subjectId}`);
  return { success: true, data: material };
}

export async function deleteMaterial(materialId: string, subjectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Fetch material
  const { data: material } = await supabase
    .from('materials')
    .select('id, subject_id, uploaded_by')
    .eq('id', materialId)
    .maybeSingle();

  if (!material) return { success: false, error: 'Material not found' };

  // Check authorization
  let isAuthorized = material.uploaded_by === user.id;

  if (!isAuthorized) {
    const { data: member } = await supabase
      .from('subject_members')
      .select('role')
      .eq('subject_id', material.subject_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (member?.role === 'teacher') isAuthorized = true;
  }

  if (!isAuthorized) {
    const { data: subject } = await supabase
      .from('subjects')
      .select('university_id')
      .eq('id', material.subject_id)
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

  if (!isAuthorized) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/subjects/${subjectId}/materials`);
  revalidatePath(`/subjects/${subjectId}`);
  return { success: true };
}

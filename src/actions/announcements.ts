'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAnnouncementSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries());
  const parsed = createAnnouncementSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { school_id, title, content, target_type } = parsed.data;

  // Validate admin/teacher
  const { data: member } = await supabase.from('school_memberships')
    .select('role')
    .eq('school_id', school_id)
    .eq('user_id', user.id)
    .single();

  if (!member || ((member.role !== 'student_admin' && member.role !== 'teacher_admin') && member.role !== 'teacher')) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: announcement, error } = await supabase.from('announcements').insert({
    school_id,
    author_id: user.id,
    title,
    content,
    target_role: target_type || null
  }).select().single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true, data: announcement };
}

export async function markAnnouncementRead(announcementId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('announcement_reads').upsert({
    announcement_id: announcementId,
    user_id: user.id
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: announcement } = await supabase.from('announcements').select('author_id, school_id').eq('id', announcementId).single();
  if (!announcement) return { success: false, error: 'Not found' };

  let isAuthorized = announcement.author_id === user.id;

  if (!isAuthorized) {
    const { data: member } = await supabase.from('school_memberships')
      .select('role')
      .eq('school_id', announcement.school_id)
      .eq('user_id', user.id)
      .single();
    if (member && member.role === 'student_admin') isAuthorized = true;
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

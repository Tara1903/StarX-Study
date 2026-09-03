'use server';

import { createClient } from '@/lib/supabase/server';
import { createAnnouncementSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const data = Object.fromEntries(formData.entries());
  const parsed = createAnnouncementSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { university_id, title, content, target_type, target_id, priority, scheduled_at } = parsed.data;

  // Validate admin/teacher
  const { data: member } = await supabase.from('university_memberships')
    .select('role')
    .eq('university_id', university_id)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'institute_head' && member.role !== 'teacher')) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: announcement, error } = await supabase.from('announcements').insert({
    university_id,
    author_id: user.id,
    title,
    content,
    target_type,
    target_id,
    priority,
    scheduled_at: scheduled_at || null
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

  const { data: announcement } = await supabase.from('announcements').select('author_id, university_id').eq('id', announcementId).single();
  if (!announcement) return { success: false, error: 'Not found' };

  let isAuthorized = announcement.author_id === user.id;

  if (!isAuthorized) {
    const { data: member } = await supabase.from('university_memberships')
      .select('role')
      .eq('university_id', announcement.university_id)
      .eq('user_id', user.id)
      .single();
    if (member && member.role === 'institute_head') isAuthorized = true;
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

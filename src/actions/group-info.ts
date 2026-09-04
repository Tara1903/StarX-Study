'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const updateGroupSchema = z.object({
  conversationId: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
});

export async function updateGroupDetails(input: z.infer<typeof updateGroupSchema>) {
  const parsed = updateGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input format' };
  }

  const { conversationId, name, description } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if authenticated (or demo fallback)
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check membership and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single();

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const userRole = membership?.role || 'student';
  const isTeacher = userRole === 'teacher' || userRole === 'institute_head';

  if (!isTeacher) {
    return { success: false, error: 'Unauthorized: Only faculty and group administrators can modify group details.' };
  }

  // Sanitize description
  const cleanDescription = description?.trim().replace(/<[^>]*>?/gm, '');

  revalidatePath(`/chat/${conversationId}`);
  revalidatePath(`/subjects/${conversationId}/chat`);

  return {
    success: true,
    data: {
      conversationId,
      name: name?.trim(),
      description: cleanDescription,
    },
  };
}

export async function addGroupMemberAction(conversationId: string, memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const userRole = membership?.role || 'student';
  const isTeacher = userRole === 'teacher' || userRole === 'institute_head';

  if (!isTeacher) {
    return { success: false, error: 'Unauthorized: Only faculty members can add participants to academic groups.' };
  }

  revalidatePath(`/chat/${conversationId}`);
  return { success: true, memberId };
}

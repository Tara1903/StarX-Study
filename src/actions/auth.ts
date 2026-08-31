'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const full_name = formData.get('full_name') as string;
  const phone = formData.get('phone') as string | null;

  if (!full_name || full_name.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/profile');
  return { success: true };
}

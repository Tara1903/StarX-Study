import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserProvider } from '@/components/providers/user-provider';
import { PlatformShell } from '@/components/layout/platform-shell';

import type { UserRole } from '@/types/database';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const [profileRes, membershipsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, avatar_type, avatar_preset_id, avatar_emoji, avatar_style, display_name, bio, phone, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('university_memberships')
      .select(`
        id,
        user_id,
        university_id,
        role,
        joined_at,
        university:universities(id, name, slug, logo_url)
      `)
      .eq('user_id', user.id)
  ]);

  const dbProfile = profileRes.data;
  if (!dbProfile) {
    redirect('/login');
  }

  const profile = dbProfile as any;
  const memberships = (membershipsRes.data as any[]) || [];
  const activeUniversity = memberships.length > 0 ? memberships[0].university : null;
  const rawRole = memberships.length > 0 ? memberships[0].role : 'student';
  const activeRole: UserRole = 
    rawRole === 'institute_head' || rawRole === 'teacher_admin' || rawRole === 'student_admin'
      ? 'institute_head'
      : rawRole === 'teacher'
        ? 'teacher'
        : 'student';

  return (
    <UserProvider 
      value={{
        profile,
        memberships,
        activeUniversity,
        activeRole
      }}
    >
      <PlatformShell>
        {children}
      </PlatformShell>
    </UserProvider>
  );
}

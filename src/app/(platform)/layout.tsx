import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserProvider } from '@/components/providers/user-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileAppShell } from '@/components/layout/mobile-app-shell';

import type { UserRole } from '@/types/database';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: dbProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!dbProfile) {
    redirect('/login');
  }

  const profile = dbProfile;

  const { data: membershipsData } = await supabase
    .from('university_memberships')
    .select(`
      *,
      university:universities(*)
    `)
    .eq('user_id', user.id);
    
  const memberships = membershipsData || [];
  const activeUniversity = memberships.length > 0 ? memberships[0].university : null;
  const activeRole: UserRole = memberships.length > 0 ? memberships[0].role : 'student';

  return (
    <UserProvider 
      value={{
        profile,
        memberships,
        activeUniversity,
        activeRole
      }}
    >
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <MobileAppShell>
            {children}
          </MobileAppShell>
        </div>
      </div>
    </UserProvider>
  );
}

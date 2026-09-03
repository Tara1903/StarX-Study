import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { UserProvider } from '@/components/providers/user-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileAppShell } from '@/components/layout/mobile-app-shell';

import type { UserRole } from '@/types/database';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('studchat_demo')?.value === 'true';

  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    // offline or mock mode
  }

  let profile: any = null;
  let memberships: any[] = [];
  let activeUniversity: any = null;
  let activeRole: UserRole = 'student';

  if (!user && isDemo) {
    user = { id: 'demo-student-id', email: 'aarav.sharma@sageuniversity.edu.in' } as any;
    profile = {
      id: 'demo-student-id',
      full_name: 'Aarav Sharma',
      display_name: 'aarav_sharma',
      avatar_url: null,
      avatar_type: 'preset',
      avatar_preset_id: 'tech_coder',
      avatar_emoji: '🚀',
      avatar_style: 'neon',
      phone: '+91 98765 43210',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    activeUniversity = {
      id: 'uni-1',
      name: 'Institute of Engineering & Technology (IET) • SAGE University, Indore',
      code: 'SAGE-INDORE',
    };
    activeRole = 'student';
  } else if (!user) {
    redirect('/login');
  } else {
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!dbProfile) {
      if (isDemo) {
        profile = {
          id: user.id,
          full_name: user.email?.split('@')[0] || 'Student',
          display_name: user.email?.split('@')[0] || 'student',
          avatar_url: null,
          avatar_type: 'preset',
          avatar_preset_id: 'tech_coder',
          avatar_emoji: '🚀',
          avatar_style: 'neon',
        };
      } else {
        redirect('/login');
      }
    } else {
      profile = dbProfile;
    }

    const { data: membershipsData } = await supabase
      .from('university_memberships')
      .select(`
        *,
        university:universities(*)
      `)
      .eq('user_id', user.id);
      
    memberships = membershipsData || [];
    activeUniversity = memberships.length > 0 ? memberships[0].university : null;
    activeRole = memberships.length > 0 ? memberships[0].role : 'student';
  }

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

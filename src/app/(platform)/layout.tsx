import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserProvider } from '@/components/providers/user-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/setup');
  }

  const { data: membershipsData } = await supabase
    .from('school_memberships')
    .select(`
      *,
      school:schools(*)
    `)
    .eq('user_id', user.id);
    
  const memberships = membershipsData || [];
  
  const activeSchool = memberships.length > 0 ? memberships[0].school : null;
  const activeRole = memberships.length > 0 ? memberships[0].role : 'student';

  return (
    <UserProvider 
      value={{
        profile,
        memberships,
        activeSchool,
        activeRole
      }}
    >
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </UserProvider>
  );
}

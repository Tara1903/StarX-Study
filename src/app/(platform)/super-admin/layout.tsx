import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, ShieldAlert, Activity, Settings } from 'lucide-react';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    notFound();
  }

  const navItems = [
    { name: 'Schools', href: '/super-admin/schools', icon: Building2 },
    { name: 'Global Users', href: '/super-admin/users', icon: Users },
    { name: 'Moderation', href: '/super-admin/moderation', icon: ShieldAlert },
    { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: Activity },
    { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 flex-shrink-0">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Super Admin
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

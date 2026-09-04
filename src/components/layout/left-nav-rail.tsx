'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { ROUTES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Megaphone,
  Bell,
  Shield,
  LogOut,
  Loader2,
} from 'lucide-react';

export function LeftNavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, activeRole } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      } catch (err) {
        console.error('Logout failed:', err);
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const isChatActive =
    pathname === ROUTES.CHAT ||
    pathname.startsWith(ROUTES.CHAT + '/') ||
    /^\/subjects\/[^/]+\/chat(\/.*)?$/.test(pathname);

  interface RailNavItem {
    id: string;
    name: string;
    href: string;
    icon: any;
    isActive: boolean;
    badge?: number;
  }

  const navItems: RailNavItem[] = [
    {
      id: 'chat',
      name: 'Chats',
      href: ROUTES.CHAT,
      icon: MessageSquare,
      isActive: isChatActive,
    },
    {
      id: 'home',
      name: 'Home',
      href: ROUTES.DASHBOARD,
      icon: LayoutDashboard,
      isActive: pathname === ROUTES.DASHBOARD,
    },
    {
      id: 'subjects',
      name: 'Subjects',
      href: ROUTES.SUBJECTS,
      icon: BookOpen,
      isActive:
        pathname === ROUTES.SUBJECTS ||
        (pathname.startsWith('/subjects') && !pathname.includes('/chat')),
    },
    {
      id: 'assignments',
      name: 'Assignments',
      href: ROUTES.ASSIGNMENTS,
      icon: ClipboardList,
      isActive: pathname.startsWith(ROUTES.ASSIGNMENTS),
    },
    {
      id: 'announcements',
      name: 'Announcements',
      href: ROUTES.ANNOUNCEMENTS,
      icon: Megaphone,
      isActive: pathname.startsWith(ROUTES.ANNOUNCEMENTS),
    },
    {
      id: 'notifications',
      name: 'Notifications',
      href: ROUTES.NOTIFICATIONS,
      icon: Bell,
      isActive: pathname.startsWith(ROUTES.NOTIFICATIONS),
    },
  ];

  return (
    <aside
      aria-label="Desktop App Rail"
      className="hidden lg:flex flex-col items-center justify-between w-16 xl:w-[68px] h-full bg-[#070E1B] border-r border-white/10 select-none py-3.5 shrink-0 z-30"
    >
      {/* Top: StudChat Brand Icon */}
      <div className="flex flex-col items-center gap-5 w-full">
        <Link
          href={ROUTES.DASHBOARD}
          title="studchat Home"
          className="relative group p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all"
        >
          <img
            src="/logo.jpg"
            alt="studchat logo"
            className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/15 group-hover:ring-primary/50 transition-all shadow-md shadow-primary/10"
          />
        </Link>

        {/* Navigation Rail Items */}
        <nav className="flex flex-col items-center gap-1.5 w-full px-2" aria-label="Primary destinations">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.name}
                className={cn(
                  'relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all group active:scale-95 cursor-pointer',
                  item.isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {/* Active Indicator Bar on Left Edge */}
                {item.isActive && (
                  <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-primary rounded-r-full shadow-sm shadow-primary" />
                )}

                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />

                {/* Badge if present and not active */}
                {Boolean(item.badge) && !item.isActive && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-[#070E1B]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Admin Shield + User Profile + Logout */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Admin Shield (Authorized Only) */}
        {activeRole === 'institute_head' && (
          <Link
            href={ROUTES.ADMIN_USERS}
            title="Administration Console"
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer',
              pathname.startsWith('/admin')
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-muted-foreground hover:text-amber-400 hover:bg-white/5'
            )}
          >
            <Shield className="w-5 h-5" />
          </Link>
        )}

        {/* User Profile Avatar */}
        <Link
          href={ROUTES.PROFILE}
          title={`${profile?.display_name || profile?.full_name || 'User'} (${activeRole ? activeRole.replace('_', ' ') : 'Student'})`}
          className={cn(
            'relative p-0.5 rounded-2xl transition-all group cursor-pointer',
            pathname === ROUTES.PROFILE
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#070E1B]'
              : 'hover:opacity-90'
          )}
        >
          <UserAvatar
            profile={profile}
            size="sm"
            className="w-9 h-9 rounded-xl ring-1 ring-white/10"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070E1B]" />
        </Link>

        {/* Logout Trigger */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign out of studchat"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

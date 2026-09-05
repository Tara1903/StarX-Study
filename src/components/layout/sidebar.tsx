'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { ROUTES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  ClipboardList,
  Megaphone,
  Bell,
  Users,
  Layers,
  BookMarked,
  UserPlus,
  Shield,
  Flag,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';

export function Sidebar() {
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

  const navItems = [
    { name: 'Home', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Chat', href: ROUTES.CHAT, icon: MessageSquare },
    { name: 'Subjects', href: ROUTES.SUBJECTS, icon: BookOpen },
    { name: 'Assignments', href: ROUTES.ASSIGNMENTS, icon: ClipboardList },
    { name: 'Announcements', href: ROUTES.ANNOUNCEMENTS, icon: Megaphone },
    ...(activeRole === 'institute_head'
      ? [
          { name: 'People', href: ROUTES.PEOPLE, icon: Users },
          { name: 'Moderation', href: ROUTES.MODERATION, icon: Shield },
        ]
      : []),
    { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  ];

  const renderNavItem = (item: { name: string; href: string; icon: any; badge?: number }) => {
    const isActive = 
      item.href === ROUTES.DASHBOARD
        ? pathname === ROUTES.DASHBOARD
        : pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
          isActive
            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
        <span className="flex-1 truncate">{item.name}</span>
        {item.badge && (
          <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-sidebar border-r border-border h-full overflow-hidden shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img src="/logo.jpg" alt="studchat logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg tracking-tight text-foreground">studchat</span>
        </Link>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div className="space-y-1">
          {navItems.map(renderNavItem)}
        </div>
      </div>

      {/* Sidebar Profile Area */}
      <div className="p-3 border-t border-border bg-card/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/40 transition-colors">
          <Link
            href={ROUTES.PROFILE}
            className="flex items-center gap-2.5 min-w-0 flex-1 group"
            title="View Profile"
          >
            <UserAvatar
              profile={profile}
              size="sm"
              className="ring-1 ring-border group-hover:ring-primary/40 transition-all shrink-0"
            />
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {profile?.display_name || profile?.full_name || 'User'}
              </span>
              <span className="text-[11px] text-muted-foreground capitalize truncate">
                {activeRole ? activeRole.replace('_', ' ') : 'Student'}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

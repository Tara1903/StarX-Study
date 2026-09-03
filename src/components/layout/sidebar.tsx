'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { ROUTES } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui/user-avatar';

import {
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  Megaphone,
  ClipboardList,
  Bell,
  Users,
  Layers,
  BookMarked,
  UserPlus,
  Shield,
  Flag,
  Settings,
  Building2,
  UsersRound,
  ShieldAlert,
  ScrollText,
  LogOut,
  Loader2,
  FolderArchive
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, activeUniversity, activeRole } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out of your session?')) {
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

  const mainLinks = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Time Table', href: ROUTES.TIMETABLE, icon: CalendarDays },
    { name: 'My Subjects', href: ROUTES.SUBJECTS, icon: BookOpen },
    { name: 'Announcements', href: ROUTES.ANNOUNCEMENTS, icon: Megaphone },
    { name: 'Assignments', href: ROUTES.ASSIGNMENTS, icon: ClipboardList },
    { name: 'Stored Media', href: ROUTES.PROFILE, icon: FolderArchive },
    { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell, badge: 3 },
  ];

  const adminLinks = [
    { name: 'Users', href: ROUTES.ADMIN_USERS, icon: Users },
    { name: 'Departments', href: ROUTES.ADMIN_DEPARTMENTS, icon: Layers },
    { name: 'Subjects', href: ROUTES.ADMIN_SUBJECTS, icon: BookMarked },
    { name: 'Enrollment', href: ROUTES.ADMIN_ENROLLMENT, icon: UserPlus },
    { name: 'Moderation', href: ROUTES.ADMIN_MODERATION, icon: Shield },
    { name: 'Reports', href: ROUTES.ADMIN_REPORTS, icon: Flag },
    { name: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
  ];

  const renderLink = (link: any) => {
    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
    const Icon = link.icon;

    return (
      <Link
        key={link.name}
        href={link.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="flex-1">{link.name}</span>
        {link.badge && (
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            {link.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-sidebar border-r border-sidebar-border h-full overflow-hidden">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80 transition-opacity">
          <img src="/logo.jpg" alt="studchat logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg tracking-tight">studchat</span>
        </Link>
      </div>

      {/* University Selector Placeholder */}
      {activeUniversity && (
        <div className="px-4 py-4">
          <button className="w-full flex items-center justify-between bg-sidebar-accent/30 hover:bg-sidebar-accent/50 text-sidebar-foreground border border-sidebar-border rounded-xl px-3 py-2 transition-colors">
            <span className="text-sm font-semibold truncate">{activeUniversity.name}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6 custom-scrollbar">
        <div className="space-y-1">
          {mainLinks.map(renderLink)}
        </div>

          {activeRole === 'institute_head' && (
            <div>
              <h4 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Administration</h4>
              <div className="space-y-1">
                {adminLinks.map(renderLink)}
              </div>
            </div>
          )}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <Link
          href={ROUTES.PROFILE}
          className="flex items-center justify-between p-1.5 -m-1.5 rounded-xl hover:bg-sidebar-accent/60 transition-colors group cursor-pointer"
          title="View Profile & Stored Media"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <UserAvatar
              profile={profile}
              size="sm"
              className="group-hover:ring-2 group-hover:ring-primary/40 transition-all"
            />
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-primary transition-colors">
                {profile.display_name || profile.full_name}
              </span>
              <span className="text-xs text-sidebar-foreground/60 capitalize truncate">
                {activeRole.replace('_', ' ')}
              </span>
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { ROUTES } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
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
  ScrollText
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { profile, activeUniversity, activeRole } = useUser();

  const mainLinks = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'My Subjects', href: ROUTES.SUBJECTS, icon: BookOpen },
    { name: 'Announcements', href: ROUTES.ANNOUNCEMENTS, icon: Megaphone },
    { name: 'Assignments', href: ROUTES.ASSIGNMENTS, icon: ClipboardList },
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

          {(activeRole === 'teacher_admin' || activeRole === 'student_admin') && (
            <div>
              <h4 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Administration</h4>
              <div className="space-y-1">
                {adminLinks.map(renderLink)}
              </div>
            </div>
          )}
      </div>

      {/* User Semester */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(profile.full_name)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name}</span>
              <span className="text-xs text-sidebar-foreground/60 capitalize truncate">
                {activeRole.replace('_', ' ')}
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

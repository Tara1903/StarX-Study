'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { LayoutDashboard, BookOpen, Megaphone, ClipboardList, User } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Subjects', href: ROUTES.SUBJECTS, icon: BookOpen },
    { name: 'Alerts', href: ROUTES.ANNOUNCEMENTS, icon: Megaphone },
    { name: 'Tasks', href: ROUTES.ASSIGNMENTS, icon: ClipboardList },
    { name: 'Profile', href: ROUTES.PROFILE, icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

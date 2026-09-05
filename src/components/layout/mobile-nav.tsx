'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users, User } from 'lucide-react';
import { isSubjectChatRoute } from '@/lib/mobile-tokens';
import { useUser } from '@/components/providers/user-provider';
import { UserAvatar } from '@/components/ui/user-avatar';

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useUser();

  // Hide bottom navigation completely when inside active conversation
  // Chat composer serves as the bottom interaction surface to prevent competing bars
  if (isSubjectChatRoute(pathname)) {
    return null;
  }

  interface MobileNavItem {
    id: string;
    name: string;
    href: string;
    icon: any;
    matchPrefix?: boolean;
    useAvatar?: boolean;
    badge?: number;
    matchCustom?: (path: string) => boolean;
  }

  const items: MobileNavItem[] = [
    {
      id: 'chat',
      name: 'Friend Chat',
      href: '/chat',
      icon: MessageSquare,
      matchPrefix: true,
    },
    {
      id: 'study-groups',
      name: 'Study Group',
      href: '/study-groups',
      icon: Users,
      matchPrefix: true,
      matchCustom: (path: string) =>
        path === '/study-groups' ||
        path.startsWith('/study-groups/') ||
        path === '/subjects' ||
        path.startsWith('/subjects/'),
    },
    {
      id: 'profile',
      name: 'Profile',
      href: '/profile',
      icon: User,
      useAvatar: true,
      matchPrefix: true,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050B16]/95 backdrop-blur-md border-t border-white/10 pb-safe shadow-2xl"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = item.matchCustom
            ? item.matchCustom(pathname) && !isSubjectChatRoute(pathname)
            : item.matchPrefix
            ? pathname === item.href || (pathname.startsWith(item.href + '/') && !isSubjectChatRoute(pathname))
            : pathname === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1.5 px-1 relative transition-all active:scale-95 ${
                isActive
                  ? 'text-[#168BFF]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Active Indicator Top Glow */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#168BFF] rounded-full shadow-[0_0_8px_#168BFF]" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center w-6 h-6">
                {item.useAvatar && profile ? (
                  <div className={`rounded-full p-0.5 transition-all ${isActive ? 'ring-2 ring-[#168BFF]' : ''}`}>
                    <UserAvatar profile={profile} size="xs" className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                )}

                {/* Notification Badge */}
                {item.badge && item.badge > 0 && (
                  <span 
                    aria-label={`${item.badge} unread notifications`}
                    className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#050B16] shadow-sm"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] tracking-tight mt-1 transition-all ${
                isActive ? 'font-bold text-[#168BFF]' : 'font-medium text-muted-foreground'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

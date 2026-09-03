"use client";

import { usePathname } from 'next/navigation';
import { isSubjectChatRoute } from '@/lib/mobile-tokens';
import { MobileHeader } from '@/components/layout/mobile-header';
import { MobileNav } from '@/components/layout/mobile-nav';

interface MobileAppShellProps {
  children: React.ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const pathname = usePathname();
  const isChat = isSubjectChatRoute(pathname);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Mobile Top Header (Hidden on Desktop and Chat) */}
      <MobileHeader />

      {/* Main Content Scroll Area */}
      <main
        className={`flex-1 overflow-x-hidden ${
          isChat
            ? 'overflow-hidden p-0 h-full flex flex-col'
            : 'overflow-y-auto pb-mobile-nav lg:pb-8'
        }`}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation (Hidden on Desktop and Chat) */}
      <MobileNav />
    </div>
  );
}

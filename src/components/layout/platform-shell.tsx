'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileAppShell } from '@/components/layout/mobile-app-shell';
import { isChatRoute } from '@/lib/mobile-tokens';

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const isChat = isChatRoute(pathname);

  if (isChat) {
    // CHAT WORKSPACE MODE:
    // Immersive, dedicated messaging application taking 100% available viewport width & height.
    // The global application sidebar, global header, and mobile dashboard shell are NOT rendered.
    return (
      <div className="h-screen w-full bg-[#050B16] text-foreground overflow-hidden">
        {children}
      </div>
    );
  }

  // NORMAL APPLICATION MODE:
  // Global navigation layout with persistent left sidebar, header, and mobile app shell.
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <MobileAppShell>
          {children}
        </MobileAppShell>
      </div>
    </div>
  );
}

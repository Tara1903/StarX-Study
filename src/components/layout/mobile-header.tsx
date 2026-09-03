"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Search, Sparkles } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getMobileHeaderInfo, isSubjectChatRoute } from '@/lib/mobile-tokens';

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();

  // If in subject chat, the immersive chat component provides its own contextual header.
  if (isSubjectChatRoute(pathname)) {
    return null;
  }

  const headerInfo = getMobileHeaderInfo(pathname);

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(headerInfo.backHref);
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 w-full bg-[#050B16]/95 backdrop-blur-md border-b border-white/10 pt-safe">
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 min-w-0">
          {headerInfo.showBack ? (
            <button
              type="button"
              onClick={handleBack}
              title="Go back"
              className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground active:scale-95 hover:bg-white/5 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 shrink-0 hover:opacity-90 active:scale-95 transition-all"
            >
              <img
                src="/logo.jpg"
                alt="studchat logo"
                className="w-8 h-8 rounded-lg object-cover border border-white/10 shadow-sm"
              />
              <span className="font-bold text-base tracking-tight text-white">studchat</span>
            </Link>
          )}

          {headerInfo.showBack && (
            <h1 className="font-bold text-base tracking-tight text-foreground truncate">
              {headerInfo.title}
            </h1>
          )}
        </div>

        {/* CENTER SECTION (For Root Pages) */}
        {!headerInfo.showBack && (
          <div className="flex items-center justify-center">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wide">
              {headerInfo.title}
            </span>
          </div>
        )}

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications Bell */}
          <Link
            href="/notifications"
            title="Notifications"
            className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-[#050B16] animate-pulse" />
          </Link>

          {/* Profile User Avatar */}
          <Link
            href="/profile"
            title="Profile"
            className="rounded-full ring-1 ring-white/20 hover:ring-2 hover:ring-primary active:scale-95 transition-all"
          >
            <UserAvatar
              profile={profile}
              size="xs"
              className="w-8 h-8 cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

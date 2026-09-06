"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Search } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getMobileHeaderInfo, isSubjectChatRoute } from '@/lib/mobile-tokens';
import { StarXLogo } from '@/components/ui/starx-logo';
import { MobileSearchSheet } from '@/components/layout/mobile-search-sheet';

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // If in subject chat, the immersive chat component provides its own contextual header.
  if (isSubjectChatRoute(pathname)) {
    return null;
  }

  const headerInfo = getMobileHeaderInfo(pathname);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(headerInfo.backHref);
    }
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 w-full bg-[#050805]/95 backdrop-blur-md border-b border-[#193022] pt-safe">
        <div className="h-14 px-3.5 flex items-center justify-between gap-2">
          {/* LEFT SECTION */}
          <div className="flex items-center gap-1.5 min-w-0">
            {headerInfo.showBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="w-10 h-10 flex items-center justify-center -ml-1.5 rounded-xl text-muted-foreground hover:text-foreground active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <StarXLogo variant="header" size="sm" href="/dashboard" />
            )}

            {headerInfo.showBack && (
              <h1 className="font-semibold text-sm tracking-tight text-foreground truncate ml-1">
                {headerInfo.title}
              </h1>
            )}
          </div>

          {/* CENTER SECTION (For Root Pages) */}
          {!headerInfo.showBack && (
            <div className="flex items-center justify-center">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wide">
                {headerInfo.title}
              </span>
            </div>
          )}

          {/* RIGHT SECTION: Search + Notifications + Profile */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <Link
              href="/notifications"
              aria-label="View notifications"
              className="relative w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background animate-pulse" />
            </Link>

            {/* Profile Avatar */}
            <Link
              href="/profile"
              aria-label="View profile"
              className="w-8 h-8 rounded-full ring-1 ring-white/20 hover:ring-2 hover:ring-primary active:scale-95 transition-all shrink-0 ml-1 overflow-hidden"
            >
              <UserAvatar
                profile={profile}
                size="xs"
                className="w-full h-full cursor-pointer"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Search Fullscreen Sheet */}
      <MobileSearchSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

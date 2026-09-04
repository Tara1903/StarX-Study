'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, LogOut, Loader2, ChevronRight } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui/user-avatar';
import { DesktopSearchDialog } from '@/components/layout/desktop-search-dialog';
import { isDesktopChatRoute } from '@/lib/mobile-tokens';

export function Header() {
  const { profile } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      } catch (err) {
        console.error('Error logging out:', err);
        setIsLoggingOut(false);
      }
    }
  };

  // Derive dynamic page context title
  const getContextTitle = () => {
    if (pathname === '/dashboard') return 'Home';
    if (pathname === '/subjects') return 'Subjects';
    if (pathname === '/assignments') return 'Assignments';
    if (pathname === '/announcements') return 'Announcements';
    if (pathname === '/notifications') return 'Notifications';
    if (pathname === '/profile') return 'Profile';
    if (pathname === '/timetable') return 'Schedule';
    if (pathname.startsWith('/admin')) return 'Administration';

    if (pathname.startsWith('/subjects/')) {
      const parts = pathname.split('/');
      const subjectId = parts[2] || '';
      const rawName = subjectId.replace(/[-_]/g, ' ');
      const subName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Subject';

      if (parts.length === 3) return subName;
      if (parts[3] === 'chat') return `${subName} • Chat`;
      if (parts[3] === 'announcements') return `${subName} • Notices`;
      if (parts[3] === 'materials') return `${subName} • Materials`;
      if (parts[3] === 'assignments') return `${subName} • Assignments`;
    }

    return 'studchat';
  };

  // When viewing chat conversations or chat hub on desktop, hide the generic header
  // Chat has its own dedicated top bar and full 100vh height like WhatsApp Web
  if (isDesktopChatRoute(pathname)) {
    return null;
  }

  return (
    <>
      <header className="hidden lg:flex h-16 items-center justify-between px-6 bg-background/90 backdrop-blur-md border-b border-border z-20 sticky top-0 shrink-0">
        {/* Left: Context Title */}
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground tracking-tight">
            {getContextTitle()}
          </span>
        </div>

        {/* Center: Search Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center justify-between w-80 px-3.5 py-1.5 bg-muted/30 hover:bg-muted/60 border border-border/80 hover:border-border rounded-xl text-sm text-muted-foreground transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Search subjects, materials...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 rounded border border-border">
            Ctrl K
          </kbd>
        </button>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            title="Notifications"
            className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/40 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background" />
          </Link>

          <Link href="/profile" title="View Profile">
            <UserAvatar 
              profile={profile} 
              size="sm" 
              className="ring-1 ring-border hover:ring-2 hover:ring-primary transition-all" 
            />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out"
            className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Global Command Palette */}
      <DesktopSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, LogOut, Loader2 } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';
import { getInitials } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const { profile } = useUser();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
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
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-background/80 backdrop-blur border-b border-border z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-9 pr-4 py-2 bg-muted border-transparent focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 rounded-lg text-sm transition-all outline-none"
          />
        </div>

        <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
        </button>

        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm ring-1 ring-primary/20">
          {getInitials(profile.full_name)}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign out of your account"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-border hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
}

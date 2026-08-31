'use client';

import { Menu, Search, Bell } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';
import { getInitials } from '@/lib/utils';

export function Header() {
  const { profile } = useUser();

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

      <div className="flex items-center gap-3 sm:gap-6">
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

        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm cursor-pointer hover:ring-2 ring-primary/20 transition-all">
          {getInitials(profile.full_name)}
        </div>
      </div>
    </header>
  );
}

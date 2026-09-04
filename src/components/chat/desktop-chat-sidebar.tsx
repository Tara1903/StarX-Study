'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, BookOpen } from 'lucide-react';
import { ECE_SUBJECTS } from '@/lib/ece-data';

interface DesktopChatSidebarProps {
  currentSubjectId: string;
}

export function DesktopChatSidebar({ currentSubjectId }: DesktopChatSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = ECE_SUBJECTS.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.facultyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hidden lg:flex flex-col w-64 bg-card/30 border-r border-border h-full shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-border/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
          Subject Rooms
        </h2>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter rooms..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-muted/40 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((sub, index) => {
          const isActive = sub.id === currentSubjectId;
          const unreadCount = index === 0 ? 3 : index === 1 ? 1 : 0;

          return (
            <Link
              key={sub.id}
              href={`/subjects/${sub.id}/chat`}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all group ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: sub.color }}
                />
                <div className="min-w-0">
                  <span className={`block truncate ${isActive ? 'text-primary-foreground font-semibold' : 'text-foreground font-medium'}`}>
                    {sub.name}
                  </span>
                  <span className={`text-[11px] block truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {sub.facultyAbb} • {sub.facultyName.split(' ')[1] || sub.facultyName}
                  </span>
                </div>
              </div>

              {unreadCount > 0 && !isActive && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

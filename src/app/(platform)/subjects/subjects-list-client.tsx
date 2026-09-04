'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MessageSquare, 
  ChevronRight,
  Calculator,
  FlaskConical,
  Zap,
  Compass,
  Code,
  Cpu,
  BookOpen
} from 'lucide-react';

export interface SubjectCardData {
  id: string;
  code: string;
  name: string;
  shortName: string;
  facultyName: string;
  facultyAbb: string;
  credits: number;
  color: string;
  description: string;
  room: string;
  icon: string;
  type: 'theory' | 'lab' | 'hybrid';
  unreadCount?: number;
}

interface SubjectsListClientProps {
  subjects: SubjectCardData[];
}

export function SubjectsListClient({ subjects }: SubjectsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getSubjectIcon = (iconName: string, name: string) => {
    const lower = (name + ' ' + iconName).toLowerCase();
    if (lower.includes('math') || lower.includes('calc')) return Calculator;
    if (lower.includes('chem')) return FlaskConical;
    if (lower.includes('elect')) return Zap;
    if (lower.includes('graph')) return Compass;
    if (lower.includes('code') || lower.includes('prog')) return Code;
    if (lower.includes('circuit') || lower.includes('esdm')) return Cpu;
    return BookOpen;
  };

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.facultyName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      {subjects.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Empty State */}
      {subjects.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-sm text-muted-foreground bg-card/40 border border-border/60 rounded-2xl max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">No Enrolled Subjects</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are not enrolled in any academic subjects yet. Once your department administrator or instructor adds you to course rosters, your subjects will appear here.
          </p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-sm text-muted-foreground bg-card/40 border border-border/60 rounded-2xl">
          No subjects match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <>
          {/* Mobile-Only Clean Elevated List (100% Tappable Rows) */}
          <div className="sm:hidden space-y-2.5">
            {filteredSubjects.map((sub) => {
              const Icon = getSubjectIcon(sub.icon, sub.name);
              const unread = sub.unreadCount || 0;

              return (
                <Link
                  key={sub.id}
                  href={`/subjects/${sub.id}/chat`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070E1B] border border-white/10 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {sub.facultyName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {unread > 0 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#168BFF]/20 text-[#168BFF] border border-[#168BFF]/30">
                        {unread} unread
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop/Tablet Grid View */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((sub) => {
              const Icon = getSubjectIcon(sub.icon, sub.name);
              const unread = sub.unreadCount || 0;

              return (
                <div
                  key={sub.id}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/90 hover:border-primary/40 transition-all shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/subjects/${sub.id}`}
                          className="font-semibold text-base text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {sub.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {sub.facultyName}
                        </p>
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {unread} unread
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground/80 text-[11px] font-mono">
                      {sub.code}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/subjects/${sub.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/subjects/${sub.id}/chat`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

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
import type { ECESubject } from '@/lib/ece-data';

interface SubjectsListClientProps {
  subjects: ECESubject[];
}

export function SubjectsListClient({ subjects }: SubjectsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getSubjectIcon = (id: string) => {
    switch (id) {
      case 'math-1': return Calculator;
      case 'chemistry': return FlaskConical;
      case 'basic-electrical': return Zap;
      case 'graphics': return Compass;
      case 'pces-1': return Code;
      case 'esdm': return Cpu;
      default: return BookOpen;
    }
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

      {/* Grid of Clean Subject Cards */}
      {filteredSubjects.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/40 border border-border/60 rounded-2xl">
          No subjects match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub, index) => {
            const Icon = getSubjectIcon(sub.id);
            // Simulated unread activity for demonstration
            const unreadCount = index === 0 ? 3 : index === 1 ? 1 : 0;

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

                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground/80 text-[11px]">
                    I Sem • B.Tech ECE
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
      )}
    </div>
  );
}

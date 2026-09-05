'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, BookOpen, FileText, ArrowRight, MessageSquare, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MobileSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchSheet({ isOpen, onClose }: MobileSearchSheetProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'subjects' | 'materials'>('all');
  const [userSubjects, setUserSubjects] = useState<{
    id: string;
    name: string;
    code?: string;
    color?: string;
  }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  useEffect(() => {
    async function loadUserSubjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('subject_members')
        .select(`
          subject:subjects(
            id,
            name,
            code,
            color
          )
        `)
        .eq('user_id', user.id);

      if (data) {
        setUserSubjects(
          data
            .map((m: any) => ({
              id: m.subject?.id,
              name: m.subject?.name,
              code: m.subject?.code || '',
              color: m.subject?.color || '#3B82F6',
            }))
            .filter((s: any) => s.id)
        );
      }
    }
    loadUserSubjects();
  }, [supabase]);

  const searchIndex = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'subjects' | 'materials';
      url: string;
      color?: string;
    }> = [];

    userSubjects.forEach((sub) => {
      items.push({
        id: `sub-${sub.id}`,
        title: sub.name,
        subtitle: sub.code ? `${sub.code} • Enrolled` : 'Enrolled Subject',
        category: 'subjects',
        url: `/subjects/${sub.id}`,
        color: sub.color,
      });

      items.push({
        id: `chat-${sub.id}`,
        title: `${sub.name} Chat`,
        subtitle: `Jump into live room`,
        category: 'subjects',
        url: `/chat/${sub.id}`,
        color: sub.color,
      });

      items.push({
        id: `mat-${sub.id}`,
        title: `${sub.name} Notes & Materials`,
        subtitle: `Lecture notes & study files`,
        category: 'materials',
        url: `/subjects/${sub.id}/materials`,
        color: sub.color,
      });
    });

    return items;
  }, [userSubjects]);

  const filtered = useMemo(() => {
    let list = searchIndex;
    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }
    if (!query.trim()) return list.slice(0, 10);
    const q = query.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [searchIndex, activeCategory, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Search Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, chats, notes..."
            className="w-full pl-9 pr-8 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-sm font-semibold text-primary px-1 hover:underline"
        >
          Cancel
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border overflow-x-auto scrollbar-none">
        {(['all', 'subjects', 'materials'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-xs">
            No matching records found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onClose();
                router.push(item.url);
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2.5 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
                <div className="truncate">
                  <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

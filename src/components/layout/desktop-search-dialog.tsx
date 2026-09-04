'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Users, 
  X, 
  ArrowRight, 
  CornerDownLeft, 
  CalendarDays, 
  Bell 
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

interface DesktopSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesktopSearchDialog({ isOpen, onClose }: DesktopSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userSubjects, setUserSubjects] = useState<{
    id: string;
    name: string;
    code?: string;
    color?: string;
    role?: string;
  }[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [supabase] = useState(() => createClient());

  // Focus input when modal opens and load user subjects
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    async function loadUserSubjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('subject_members')
        .select(`
          role,
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
              role: m.role,
            }))
            .filter((s: any) => s.id)
        );
      }
    }
    loadUserSubjects();
  }, [supabase]);

  // Searchable items derived strictly from user authorization
  const searchableItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'Subjects' | 'Navigation' | 'Materials';
      url: string;
      color?: string;
    }> = [];

    // Navigation links
    items.push(
      { id: 'nav-home', title: 'Dashboard', subtitle: 'Overview & Attention items', category: 'Navigation', url: ROUTES.DASHBOARD },
      { id: 'nav-chat', title: 'Chat Hub', subtitle: 'All messages & conversations', category: 'Navigation', url: ROUTES.CHAT },
      { id: 'nav-subjects', title: 'Subjects', subtitle: 'View all enrolled subjects', category: 'Navigation', url: ROUTES.SUBJECTS },
      { id: 'nav-assignments', title: 'Assignments', subtitle: 'Coursework & deadlines', category: 'Navigation', url: ROUTES.ASSIGNMENTS },
      { id: 'nav-announcements', title: 'Announcements', subtitle: 'Campus & academic notices', category: 'Navigation', url: ROUTES.ANNOUNCEMENTS },
      { id: 'nav-notifications', title: 'Notifications', subtitle: 'Recent alerts & mentions', category: 'Navigation', url: ROUTES.NOTIFICATIONS },
      { id: 'nav-profile', title: 'My Profile', subtitle: 'Account & stored media', category: 'Navigation', url: ROUTES.PROFILE },
    );

    // User's authorized enrolled subjects
    userSubjects.forEach((sub) => {
      // Subject overview
      items.push({
        id: `sub-${sub.id}`,
        title: sub.name,
        subtitle: sub.code ? `${sub.code} • Enrolled` : 'Enrolled Subject',
        category: 'Subjects',
        url: `/subjects/${sub.id}`,
        color: sub.color,
      });

      // Direct chat
      items.push({
        id: `chat-${sub.id}`,
        title: `${sub.name} Chat`,
        subtitle: `Jump to live discussion room`,
        category: 'Subjects',
        url: `/subjects/${sub.id}/chat`,
        color: sub.color,
      });

      // Subject materials
      items.push({
        id: `mat-${sub.id}`,
        title: `${sub.name} Materials`,
        subtitle: `Lecture notes & reference files`,
        category: 'Materials',
        url: `/subjects/${sub.id}/materials`,
        color: sub.color,
      });
    });

    return items;
  }, [userSubjects]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show top suggestions when empty
      return searchableItems.slice(0, 8);
    }
    const q = query.toLowerCase().trim();
    return searchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query, searchableItems]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].url);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#070E1B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[550px] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a subject, faculty, or page to jump to..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No results found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/15 text-foreground font-medium'
                      : 'text-foreground/80 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-2 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: item.color || '#3B82F6' }}
                    />
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/5">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Key Hints */}
        <div className="px-4 py-2 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/5 border border-white/10 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/5 border border-white/10 rounded">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/5 border border-white/10 rounded">↵</kbd>
              Open
            </span>
          </div>
          <span>studchat Global Search</span>
        </div>
      </div>
    </div>
  );
}

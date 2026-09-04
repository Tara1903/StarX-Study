'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  X, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Megaphone, 
  ChevronRight 
} from 'lucide-react';
import { ECE_SUBJECTS } from '@/lib/ece-data';
import { ROUTES } from '@/lib/constants';

interface MobileSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchSheet({ isOpen, onClose }: MobileSearchSheetProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'subjects' | 'materials' | 'announcements'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  const searchIndex = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'subjects' | 'materials' | 'announcements';
      url: string;
      color?: string;
    }> = [];

    ECE_SUBJECTS.forEach((sub) => {
      items.push({
        id: `sub-${sub.id}`,
        title: sub.name,
        subtitle: `${sub.code} • ${sub.facultyName}`,
        category: 'subjects',
        url: `/subjects/${sub.id}`,
        color: sub.color,
      });

      items.push({
        id: `chat-${sub.id}`,
        title: `${sub.name} Chat`,
        subtitle: `Jump into live room`,
        category: 'subjects',
        url: `/subjects/${sub.id}/chat`,
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

    items.push(
      {
        id: 'ann-1',
        title: 'Mid-Term Examination 1 Schedule',
        subtitle: 'Examination Cell official notice',
        category: 'announcements',
        url: '/announcements',
      },
      {
        id: 'ann-2',
        title: 'Mandatory 75% Attendance Notice',
        subtitle: 'Academic Dean guidelines',
        category: 'announcements',
        url: '/announcements',
      },
      {
        id: 'ann-3',
        title: 'Library Evening Timings',
        subtitle: 'Central engineering library',
        category: 'announcements',
        url: '/announcements',
      }
    );

    return items;
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return searchIndex.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory, searchIndex]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Search"
      className="fixed inset-0 z-50 bg-[#050B16] flex flex-col pt-safe animate-in fade-in duration-150"
    >
      {/* Search Header */}
      <div className="h-14 px-3 flex items-center gap-2 border-b border-white/10 bg-[#050B16]/95 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, chat, materials..."
            className="w-full h-10 pl-9 pr-8 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear query"
              className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-white/5 bg-[#050B16]/60 shrink-0">
        {[
          { id: 'all', label: 'All' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'materials', label: 'Materials' },
          { id: 'announcements', label: 'Announcements' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white/5 text-muted-foreground hover:text-foreground border border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {results.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No matching results found for &ldquo;{query}&rdquo;
          </div>
        ) : (
          results.map((item) => {
            const Icon = 
              item.category === 'subjects' 
                ? (item.title.includes('Chat') ? MessageSquare : BookOpen)
                : item.category === 'materials'
                ? FileText
                : Megaphone;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.url)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card/40 hover:bg-white/5 active:bg-white/10 border border-white/5 transition-all text-left group min-h-[52px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.color ? `${item.color}20` : 'rgba(255,255,255,0.08)', color: item.color || '#168BFF' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

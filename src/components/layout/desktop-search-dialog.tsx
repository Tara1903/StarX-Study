'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Megaphone, 
  ClipboardList, 
  User, 
  ArrowRight, 
  X, 
  CornerDownLeft, 
  CalendarDays, 
  Bell 
} from 'lucide-react';
import { ECE_SUBJECTS } from '@/lib/ece-data';
import { ROUTES } from '@/lib/constants';

interface DesktopSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesktopSearchDialog({ isOpen, onClose }: DesktopSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Static searchable items
  const searchableItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'Subjects' | 'Navigation' | 'Materials' | 'Faculty';
      url: string;
      color?: string;
    }> = [];

    // Navigation links
    items.push(
      { id: 'nav-home', title: 'Dashboard', subtitle: 'Overview & Attention items', category: 'Navigation', url: ROUTES.DASHBOARD },
      { id: 'nav-subjects', title: 'Subjects', subtitle: 'View all enrolled subjects', category: 'Navigation', url: ROUTES.SUBJECTS },
      { id: 'nav-assignments', title: 'Assignments', subtitle: 'Coursework & deadlines', category: 'Navigation', url: ROUTES.ASSIGNMENTS },
      { id: 'nav-announcements', title: 'Announcements', subtitle: 'Campus & academic notices', category: 'Navigation', url: ROUTES.ANNOUNCEMENTS },
      { id: 'nav-notifications', title: 'Notifications', subtitle: 'Recent alerts & mentions', category: 'Navigation', url: ROUTES.NOTIFICATIONS },
      { id: 'nav-profile', title: 'My Profile', subtitle: 'Account & stored media', category: 'Navigation', url: ROUTES.PROFILE },
    );

    // ECE Subjects
    ECE_SUBJECTS.forEach((sub) => {
      // Subject overview
      items.push({
        id: `sub-${sub.id}`,
        title: sub.name,
        subtitle: `${sub.code} • ${sub.facultyName}`,
        category: 'Subjects',
        url: `/subjects/${sub.id}`,
        color: sub.color,
      });

      // Direct chat
      items.push({
        id: `chat-${sub.id}`,
        title: `${sub.name} Chat`,
        subtitle: `Jump to ${sub.shortName} live room`,
        category: 'Subjects',
        url: `/subjects/${sub.id}/chat`,
        color: sub.color,
      });

      // Subject materials
      items.push({
        id: `mat-${sub.id}`,
        title: `${sub.name} Materials`,
        subtitle: `Lecture notes, syllabus, reference files`,
        category: 'Materials',
        url: `/subjects/${sub.id}/materials`,
        color: sub.color,
      });

      // Faculty contact
      items.push({
        id: `fac-${sub.id}`,
        title: sub.facultyName,
        subtitle: `Faculty In-Charge • ${sub.name} (${sub.facultyAbb})`,
        category: 'Faculty',
        url: `/subjects/${sub.id}`,
      });
    });

    return items;
  }, []);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return searchableItems.slice(0, 8);
    }
    const q = query.toLowerCase().trim();
    return searchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, searchableItems]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].url);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-card border border-border/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-border/80 gap-3 bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search subjects, chat rooms, materials, navigation..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-muted/60 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/20">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No matching results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = 
                  item.category === 'Subjects' ? (item.title.includes('Chat') ? MessageSquare : BookOpen) :
                  item.category === 'Materials' ? FileText :
                  item.category === 'Faculty' ? User :
                  ArrowRight;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.url)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                        }`}
                        style={item.color && !isSelected ? { backgroundColor: `${item.color}20`, color: item.color } : undefined}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate leading-tight">
                          {item.title}
                        </div>
                        <div className={`text-xs truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-muted/70 text-muted-foreground'
                      }`}>
                        {item.category}
                      </span>
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-white/90" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to open</span>
          </div>
          <span>studchat global search</span>
        </div>
      </div>
    </div>
  );
}

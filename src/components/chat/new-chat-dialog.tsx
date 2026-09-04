'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, BookOpen, GraduationCap, Check } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ECE_SUBJECTS } from '@/lib/ece-data';
import { INITIAL_PERSONAL_CHATS } from '@/lib/conversations';
import { cn } from '@/lib/utils';

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatDialog({ isOpen, onClose }: NewChatDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'teachers' | 'students' | 'subjects'>('all');

  const contacts = useMemo(() => {
    // 1. Personal contacts
    const personalItems = INITIAL_PERSONAL_CHATS.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: c.subtitle,
      role: c.role || 'student',
      type: 'personal' as const,
      avatarPresetId: c.avatarPresetId,
      avatarEmoji: c.avatarEmoji,
      color: undefined,
    }));

    // 2. Subject cohort groups
    const subjectItems = ECE_SUBJECTS.map((s) => ({
      id: s.id,
      name: s.name,
      subtitle: `${s.code} • ${s.facultyAbb} (${s.facultyName})`,
      role: 'subject' as const,
      type: 'subject' as const,
      avatarPresetId: undefined,
      avatarEmoji: undefined,
      color: s.color,
    }));

    return [...personalItems, ...subjectItems];
  }, []);

  const filteredContacts = useMemo(() => {
    let list = contacts;

    if (filterType === 'teachers') {
      list = list.filter((c) => c.role === 'teacher');
    } else if (filterType === 'students') {
      list = list.filter((c) => c.role === 'student');
    } else if (filterType === 'subjects') {
      list = list.filter((c) => c.type === 'subject');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q)
      );
    }

    return list;
  }, [contacts, filterType, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    onClose();
    router.push(`/chat/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#070E1B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 id="new-chat-title" className="text-base font-bold text-foreground tracking-tight">
            New Chat
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 border-b border-white/10 space-y-2.5 shrink-0 bg-white/[0.01]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts or cohort members..."
              autoFocus
              className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white/[0.07] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer',
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('teachers')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer',
                filterType === 'teachers'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Teachers</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('students')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer',
                filterType === 'students'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Classmates</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('subjects')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer',
                filterType === 'subjects'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Subjects</span>
            </button>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No matching members or subjects found.
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelect(contact.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all text-left cursor-pointer group"
              >
                {contact.type === 'subject' ? (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ring-1 ring-white/10 shrink-0"
                    style={{
                      backgroundColor: contact.color
                        ? `${contact.color}25`
                        : 'rgba(59, 130, 246, 0.2)',
                      color: contact.color || '#3B82F6',
                    }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                ) : (
                  <UserAvatar
                    name={contact.name}
                    avatarType="preset"
                    avatarPresetId={contact.avatarPresetId}
                    avatarEmoji={contact.avatarEmoji}
                    size="md"
                    className="w-10 h-10 rounded-xl ring-1 ring-white/10 shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {contact.name}
                    </span>
                    {contact.role === 'teacher' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Teacher
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {contact.subtitle}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { createClient } from '@/lib/supabase/client';
import { getOrCreatePersonalConversation } from '@/actions/conversations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactItem {
  id: string;
  name: string;
  subtitle: string;
  role: 'teacher' | 'student' | 'subject';
  type: 'personal' | 'subject';
  avatarUrl?: string | null;
  avatarType?: any;
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  color?: string;
  personUserId?: string;
}

export function NewChatDialog({ isOpen, onClose }: NewChatDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'teachers' | 'students' | 'subjects'>('all');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadContacts() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const items: ContactItem[] = [];

        // 1. Fetch user's enrolled subjects
        const { data: mySubjects } = await supabase
          .from('subject_members')
          .select(`
            subject:subjects(id, name, color)
          `)
          .eq('user_id', user.id);

        if (mySubjects) {
          mySubjects.forEach((sm: any) => {
            if (sm.subject) {
              items.push({
                id: sm.subject.id,
                name: sm.subject.name,
                subtitle: 'Subject Group Room',
                role: 'subject',
                type: 'subject',
                color: sm.subject.color || '#3B82F6',
              });
            }
          });
        }

        // 2. Fetch peers & teachers from shared university memberships
        const { data: myMemberships } = await supabase
          .from('university_memberships')
          .select('university_id')
          .eq('user_id', user.id);

        const uniIds = (myMemberships || []).map((m: any) => m.university_id);

        if (uniIds.length > 0) {
          const { data: peers } = await supabase
            .from('university_memberships')
            .select(`
              user_id,
              role,
              profile:profiles!inner(
                id,
                full_name,
                avatar_url,
                avatar_type,
                avatar_preset_id,
                avatar_emoji,
                bio
              )
            `)
            .in('university_id', uniIds)
            .neq('user_id', user.id)
            .limit(50);

          if (peers) {
            peers.forEach((p: any) => {
              const prof = p.profile;
              items.push({
                id: `user-${prof.id}`,
                personUserId: prof.id,
                name: prof.full_name,
                subtitle: p.role === 'teacher' ? 'Faculty Member' : 'Student Classmate',
                role: p.role === 'teacher' ? 'teacher' : 'student',
                type: 'personal',
                avatarUrl: prof.avatar_url,
                avatarType: prof.avatar_type || 'initials',
                avatarPresetId: prof.avatar_preset_id,
                avatarEmoji: prof.avatar_emoji,
              });
            });
          }
        }

        if (isMounted) {
          setContacts(items);
        }
      } catch (err) {
        console.error('Error loading contacts in NewChatDialog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadContacts();
    return () => {
      isMounted = false;
    };
  }, [isOpen, supabase]);

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

  const handleSelect = async (contact: ContactItem) => {
    if (contact.type === 'subject') {
      onClose();
      router.push(`/chat/${contact.id}`);
      return;
    }

    if (contact.personUserId) {
      try {
        setStartingChat(contact.id);
        const res = await getOrCreatePersonalConversation(contact.personUserId);
        if (res.success && res.conversationId) {
          onClose();
          router.push(`/chat/${res.conversationId}`);
        } else {
          toast.error(res.error || 'Could not start personal chat');
        }
      } catch {
        toast.error('Failed to create chat session');
      } finally {
        setStartingChat(null);
      }
    }
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
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No matching members or subjects found.
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                disabled={startingChat === contact.id}
                onClick={() => handleSelect(contact)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all text-left cursor-pointer group disabled:opacity-50"
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
                    avatarType={contact.avatarType}
                    avatarPresetId={contact.avatarPresetId}
                    avatarEmoji={contact.avatarEmoji}
                    avatarUrl={contact.avatarUrl}
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

                {startingChat === contact.id && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

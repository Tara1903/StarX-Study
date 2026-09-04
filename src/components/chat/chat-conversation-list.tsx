'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  X,
  MessageSquare,
  BookOpen,
  User,
  SquarePen,
  MoreVertical,
  CheckCheck,
  BellOff,
  Pin,
} from 'lucide-react';
import { ChatConversationRow } from './chat-conversation-row';
import {
  getAllConversations,
  filterConversations,
  type ChatConversation,
  type ConversationFilterCategory,
} from '@/lib/conversations';
import { NewChatDialog } from './new-chat-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatConversationListProps {
  currentConversationId?: string;
  onSelectConversation?: (conversation: ChatConversation) => void;
  className?: string;
}

export function ChatConversationList({
  currentConversationId,
  onSelectConversation,
  className,
}: ChatConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ConversationFilterCategory>('all');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [unreadOverride, setUnreadOverride] = useState<Record<string, number>>({});

  const allConversations = useMemo(() => {
    const raw = getAllConversations();
    return raw.map((c) => ({
      ...c,
      unreadCount: unreadOverride[c.id] !== undefined ? unreadOverride[c.id] : c.unreadCount,
    }));
  }, [unreadOverride]);

  const filteredConversations = useMemo(() => {
    return filterConversations(allConversations, searchQuery, activeCategory);
  }, [allConversations, searchQuery, activeCategory]);

  const pinnedConversations = useMemo(() => {
    if (searchQuery.trim() || activeCategory !== 'all') return [];
    return filteredConversations.filter((c) => c.isPinned);
  }, [filteredConversations, searchQuery, activeCategory]);

  const otherConversations = useMemo(() => {
    if (searchQuery.trim() || activeCategory !== 'all') return filteredConversations;
    return filteredConversations.filter((c) => !c.isPinned);
  }, [filteredConversations, searchQuery, activeCategory]);

  const totalUnread = useMemo(() => {
    return allConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [allConversations]);

  const handleMarkAllRead = () => {
    const overrides: Record<string, number> = {};
    allConversations.forEach((c) => {
      overrides[c.id] = 0;
    });
    setUnreadOverride(overrides);
    setShowOptionsMenu(false);
    toast.success('Marked all conversations as read');
  };

  return (
    <div className={cn('flex flex-col h-full bg-[#050B16] border-r border-white/10 select-none relative', className)}>
      {/* List Header */}
      <div className="p-3 sm:p-3.5 border-b border-white/10 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Chats</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 animate-in zoom-in-75">
                {totalUnread}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* New Chat Button */}
            <button
              type="button"
              onClick={() => setIsNewChatOpen(true)}
              title="New chat"
              aria-label="New chat"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <SquarePen className="w-4 h-4 text-primary" />
            </button>

            {/* Options Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu((prev) => !prev)}
                title="Chat options"
                aria-label="Chat options"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-9 w-44 bg-[#091324] border border-white/15 rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-white/5 text-left transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Mark all as read</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setActiveCategory('unread');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-white/5 text-left transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Filter unread</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp-Style Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start a new chat"
            className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white/[0.07] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills: [All] [Unread] [Subjects] [Personal] */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('unread')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
              activeCategory === 'unread'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
            )}
          >
            <span>Unread</span>
            {totalUnread > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-primary/20 text-primary-foreground font-bold">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('subjects')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
              activeCategory === 'subjects'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
            )}
          >
            <BookOpen className="w-3 h-3" />
            <span>Subjects</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('personal')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
              activeCategory === 'personal'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
            )}
          >
            <User className="w-3 h-3" />
            <span>Personal</span>
          </button>
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2 mt-8">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No chats found</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              {searchQuery
                ? `No conversation matches "${searchQuery}". Try a different name or subject.`
                : 'No conversations in this section yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Pinned Section if relevant */}
            {pinnedConversations.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                  <Pin className="w-3 h-3 rotate-45 text-primary" />
                  <span>Pinned</span>
                </div>
                {pinnedConversations.map((conv) => (
                  <ChatConversationRow
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentConversationId}
                    onClick={() => onSelectConversation?.(conv)}
                  />
                ))}
              </div>
            )}

            {/* Main / Other Conversations */}
            {pinnedConversations.length > 0 && otherConversations.length > 0 && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1 mt-2">
                <span>All Chats</span>
              </div>
            )}

            {otherConversations.map((conv) => (
              <ChatConversationRow
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onClick={() => onSelectConversation?.(conv)}
              />
            ))}
          </>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
}

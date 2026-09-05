'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  MessageSquare,
  BookOpen,
  User,
  SquarePen,
  MoreVertical,
  CheckCheck,
  Pin,
  Loader2,
  ArrowLeft,
  Users,
  UserCheck,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { ChatConversationRow } from './chat-conversation-row';
import {
  filterConversations,
  type ChatConversation,
  type ConversationFilterCategory,
} from '@/lib/conversations';
import { getUserConversations, markConversationRead, getOrCreatePersonalConversation } from '@/actions/conversations';
import { getUserFriends, getAcademicStudmates, addFriend, removeFriend, type FriendItem, type StudmateItem } from '@/actions/friends';
import { NewChatDialog } from './new-chat-dialog';
import { useUser } from '@/components/providers/user-provider';
import { UserAvatar } from '@/components/ui/user-avatar';
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
  const params = useParams();
  const router = useRouter();
  const routeConvId = params?.conversationId as string | undefined;
  const activeId = currentConversationId || routeConvId;
  const { profile } = useUser();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ConversationFilterCategory>('all');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [unreadOverride, setUnreadOverride] = useState<Record<string, number>>({});

  // Friends & Studmates state
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [studmates, setStudmates] = useState<StudmateItem[]>([]);
  const [studmateSearchQuery, setStudmateSearchQuery] = useState('');
  const [loadingStudmates, setLoadingStudmates] = useState(false);
  const [openingChatUserId, setOpeningChatUserId] = useState<string | null>(null);

  // Load user conversations
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await getUserConversations();
        if (isMounted && res.success) {
          setConversations(res.data);
        }
      } catch (err) {
        console.error('Failed to load user conversations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load friends when Friends tab is opened
  useEffect(() => {
    if (activeCategory === 'friends') {
      let isMounted = true;
      setLoadingFriends(true);
      getUserFriends()
        .then((res) => {
          if (isMounted && res.success) {
            setFriends(res.data);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingFriends(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [activeCategory]);

  // Load studmates when Studmates tab is opened or studmateSearchQuery changes
  useEffect(() => {
    if (activeCategory === 'studmates') {
      let isMounted = true;
      setLoadingStudmates(true);
      const timer = setTimeout(() => {
        getAcademicStudmates(studmateSearchQuery)
          .then((res) => {
            if (isMounted && res.success) {
              setStudmates(res.data);
            }
          })
          .finally(() => {
            if (isMounted) setLoadingStudmates(false);
          });
      }, 150);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [activeCategory, studmateSearchQuery]);

  const allConversations = useMemo(() => {
    return conversations.map((c) => ({
      ...c,
      unreadCount: unreadOverride[c.id] !== undefined ? unreadOverride[c.id] : c.unreadCount,
    }));
  }, [conversations, unreadOverride]);

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

  const handleMarkAllRead = async () => {
    const overrides: Record<string, number> = {};
    allConversations.forEach((c) => {
      overrides[c.id] = 0;
      markConversationRead(c.id).catch(() => {});
    });
    setUnreadOverride(overrides);
    setShowOptionsMenu(false);
    toast.success('Marked all conversations as read');
  };

  // Open canonical personal conversation for Friend or Studmate
  const handleOpenPersonalChat = async (targetUserId: string, targetName: string, existingConvId?: string) => {
    if (existingConvId) {
      router.push(`/chat/${existingConvId}`);
      onSelectConversation?.({
        id: existingConvId,
        type: 'personal',
        name: targetName,
        subtitle: 'Direct Message',
        avatarType: 'initials',
        unreadCount: 0,
        lastActivityTimestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      setOpeningChatUserId(targetUserId);
      const res = await getOrCreatePersonalConversation(targetUserId);
      if (res.success && res.conversationId) {
        router.push(`/chat/${res.conversationId}`);
        onSelectConversation?.({
          id: res.conversationId,
          type: 'personal',
          name: targetName,
          subtitle: 'Direct Message',
          avatarType: 'initials',
          unreadCount: 0,
          lastActivityTimestamp: new Date().toISOString(),
        });
      } else {
        toast.error(res.error || 'Failed to start conversation');
      }
    } catch {
      toast.error('Could not start conversation');
    } finally {
      setOpeningChatUserId(null);
    }
  };

  // Toggle friend relationship
  const handleToggleFriend = async (e: React.MouseEvent, studmate: StudmateItem) => {
    e.stopPropagation();
    if (studmate.isFriend) {
      const res = await removeFriend(studmate.id);
      if (res.success) {
        toast.success(`Removed ${studmate.fullName} from friends`);
        setStudmates((prev) =>
          prev.map((s) => (s.id === studmate.id ? { ...s, isFriend: false } : s))
        );
        setFriends((prev) => prev.filter((f) => f.id !== studmate.id));
      } else {
        toast.error(res.error || 'Failed to remove friend');
      }
    } else {
      const res = await addFriend(studmate.id);
      if (res.success) {
        toast.success(`Added ${studmate.fullName} to friends!`);
        setStudmates((prev) =>
          prev.map((s) => (s.id === studmate.id ? { ...s, isFriend: true } : s))
        );
        getUserFriends().then((fRes) => {
          if (fRes.success) setFriends(fRes.data);
        });
      } else {
        toast.error(res.error || 'Failed to add friend');
      }
    }
  };

  // Global shortcut (Ctrl+K or Cmd+K) to focus chat search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('flex flex-col h-full bg-[#050B16] border-r border-white/10 select-none relative', className)}>
      {/* Top Header: ← studchat Workspace Exit + Profile */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-white/5 bg-[#070E1B]/80 shrink-0 select-none">
        <Link
          href="/dashboard"
          title="Back to studchat (Dashboard)"
          className="inline-flex items-center gap-2 px-2 py-1 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <img
            src="/logo.jpg"
            alt="studchat logo"
            className="w-5 h-5 rounded-lg object-cover ring-1 ring-white/15"
          />
          <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
            studchat
          </span>
        </Link>

        {/* Profile Shortcut */}
        <Link
          href="/profile"
          title="My Profile"
          className="p-0.5 rounded-xl hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
        >
          <UserAvatar profile={profile} size="xs" className="w-7 h-7 rounded-lg ring-1 ring-white/10" />
        </Link>
      </div>

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

        {/* Search Field (Hidden when on Studmates tab to avoid duplicate inputs) */}
        {activeCategory !== 'studmates' && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              ref={searchInputRef}
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
        )}

        {/* Primary Filter Tabs: [All] [Friends] [Studmates] [Study Groups] [Unread] */}
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
            onClick={() => setActiveCategory('friends')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
              activeCategory === 'friends'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
            )}
          >
            <UserCheck className="w-3 h-3 text-cyan-400" />
            <span>Friends</span>
            {friends.length > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-white/15 text-foreground font-bold">
                {friends.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('studmates')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
              activeCategory === 'studmates'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
            )}
          >
            <Users className="w-3 h-3 text-emerald-400" />
            <span>Studmates</span>
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
            <BookOpen className="w-3 h-3 text-blue-400" />
            <span>Study Groups</span>
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* ======================================================= */}
        {/* 1. FRIENDS TAB VIEW */}
        {/* ======================================================= */}
        {activeCategory === 'friends' && (
          <div>
            <div className="px-2 py-1.5 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>My Friends ({friends.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveCategory('studmates')}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>Find Studmates</span>
              </button>
            </div>

            {loadingFriends ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2 mt-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading your friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3 mt-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No friends added yet</p>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                    Connect with fellow studmates from your academic classes and add them to your friends!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCategory('studmates')}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                >
                  Browse Studmates
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {friends.map((friend) => {
                  const isOpening = openingChatUserId === friend.id;

                  return (
                    <div
                      key={friend.id}
                      onClick={() => handleOpenPersonalChat(friend.id, friend.fullName, friend.conversationId)}
                      className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <UserAvatar
                            name={friend.fullName}
                            avatarUrl={friend.avatarUrl}
                            avatarType={friend.avatarType || 'initials'}
                            avatarPresetId={friend.avatarPresetId}
                            avatarEmoji={friend.avatarEmoji}
                            size="md"
                            className="w-10 h-10 rounded-2xl ring-1 ring-white/10"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#050B16]" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {friend.fullName}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {friend.bio || 'Friend • Tap to message'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isOpening ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <div className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* 2. STUDMATES TAB VIEW (Dedicated Studmate Search) */}
        {/* ======================================================= */}
        {activeCategory === 'studmates' && (
          <div>
            {/* Dedicated Studmate Search Input */}
            <div className="px-1 mb-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="text"
                  value={studmateSearchQuery}
                  onChange={(e) => setStudmateSearchQuery(e.target.value)}
                  placeholder="Search studmates in your classes..."
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white/[0.07] transition-all"
                />
                {studmateSearchQuery && (
                  <button
                    onClick={() => setStudmateSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 px-1 pt-1">
                Searching peers enrolled in your shared academic subjects only.
              </p>
            </div>

            {loadingStudmates ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2 mt-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Finding cohort studmates...</p>
              </div>
            ) : studmates.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2 mt-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">No studmates found</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  {studmateSearchQuery
                    ? `No studmates matching "${studmateSearchQuery}" in your current classes.`
                    : 'You have no peer studmates registered in your academic cohort yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {studmates.map((studmate) => {
                  const isOpening = openingChatUserId === studmate.id;

                  return (
                    <div
                      key={studmate.id}
                      onClick={() => handleOpenPersonalChat(studmate.id, studmate.fullName, studmate.conversationId)}
                      className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          name={studmate.fullName}
                          avatarUrl={studmate.avatarUrl}
                          avatarType={studmate.avatarType || 'initials'}
                          avatarPresetId={studmate.avatarPresetId}
                          avatarEmoji={studmate.avatarEmoji}
                          size="md"
                          className="w-10 h-10 rounded-2xl ring-1 ring-white/10 shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {studmate.fullName}
                            </h4>
                            {studmate.isFriend && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-400 font-medium border border-cyan-500/20 shrink-0">
                                Friend
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {studmate.academicContext || 'Studmate'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {/* Friend Action Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFriend(e, studmate)}
                          title={studmate.isFriend ? 'Remove from Friends' : 'Add to Friends'}
                          className={cn(
                            'p-1.5 rounded-xl border text-xs transition-all cursor-pointer',
                            studmate.isFriend
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20'
                              : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10'
                          )}
                        >
                          {studmate.isFriend ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Chat Action Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPersonalChat(studmate.id, studmate.fullName, studmate.conversationId)}
                          className="px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {isOpening ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3" />
                              <span className="hidden sm:inline">Chat</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* 3. CONVERSATIONS VIEW (All / Subjects / Unread) */}
        {/* ======================================================= */}
        {activeCategory !== 'friends' && activeCategory !== 'studmates' && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2 mt-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading your chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
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
                        isActive={conv.id === activeId}
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
                    isActive={conv.id === activeId}
                    onClick={() => onSelectConversation?.(conv)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* New Chat Dialog */}
      {isNewChatOpen && (
        <NewChatDialog
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { usePresence } from '@/hooks/use-presence';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { GroupInfoPanel } from '@/components/chat/group-info/group-info-panel';
import { getRealGroupInfo } from '@/actions/group-info';
import type { GroupInfoData } from '@/lib/group-info-data';
import type { ChatConversation } from '@/lib/conversations';
import { 
  Users, 
  Pin, 
  Search, 
  Bell, 
  BellOff, 
  Trash2, 
  ArrowLeft, 
  X,
  Info,
  MessageSquareText,
  FileImage,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import type { MessageWithSender, AvatarType } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  subjectId: string;
  subjectUuid?: string;
  subjectName: string;
  subjectCode?: string;
  facultyName?: string;
  facultyAbb?: string;
  academicContext?: string;
  room?: string;
  color?: string;
  conversationType?: 'subject' | 'personal';
  backHref?: string;
  avatarUrl?: string | null;
  avatarType?: AvatarType;
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  onlineStatus?: 'online' | 'offline' | 'typing';
  bio?: string;
  role?: string;
  defaultGroupInfoOpen?: boolean;
}

export function ChatContainer({
  subjectId,
  subjectUuid,
  subjectName,
  subjectCode,
  facultyName,
  facultyAbb,
  academicContext = 'B.Tech ECE • 1st Year • Semester 1 • Section A',
  room = 'Room No. 03',
  color = '#3B82F6',
  conversationType = 'subject',
  backHref,
  avatarUrl,
  avatarType,
  avatarPresetId,
  avatarEmoji,
  onlineStatus = 'online',
  bio,
  role,
  defaultGroupInfoOpen = false,
}: ChatContainerProps) {
  const { 
    messages, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMore, 
    appendMessage, 
    clearChatOption, 
    isMuted, 
    toggleMute 
  } = useRealtimeMessages(subjectId, subjectUuid);

  const { onlineUsers } = usePresence(subjectId);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(defaultGroupInfoOpen);
  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [groupInfoData, setGroupInfoData] = useState<GroupInfoData | null>(null);

  // Lazy-load Group Info data ONLY when the panel is opened
  useEffect(() => {
    if (!isGroupInfoOpen) return;
    let isMounted = true;
    getRealGroupInfo(subjectId).then((data) => {
      if (isMounted) {
        setGroupInfoData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [subjectId, isGroupInfoOpen]);

  useEffect(() => {
    if (defaultGroupInfoOpen !== undefined) {
      setIsGroupInfoOpen(defaultGroupInfoOpen);
    }
  }, [defaultGroupInfoOpen]);

  // Keyboard shortcut: Escape closes Group Info or in-chat Search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isGroupInfoOpen) {
          setIsGroupInfoOpen(false);
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGroupInfoOpen, isSearchOpen]);

  const isPersonal = conversationType === 'personal';
  const effectiveBackHref = backHref || (isPersonal ? '/chat' : `/chat/${subjectId}`);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setIsDeleteMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileActionsOpen(false);
      }
    }
    if (isDeleteMenuOpen || isMobileActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDeleteMenuOpen, isMobileActionsOpen]);

  // Filter messages by search or pinned
  const displayedMessages = useMemo(() => {
    let list = messages;
    if (showPinnedOnly) {
      list = list.filter((m) => m.is_pinned);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.sender?.full_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, showPinnedOnly, searchQuery]);

  const pinnedMessage = useMemo(() => {
    return messages.find((m) => m.is_pinned);
  }, [messages]);

  const handleClearOption = (option: 'chat_only' | 'media_only' | 'everything') => {
    setIsDeleteMenuOpen(false);
    if (option === 'chat_only') {
      clearChatOption('chat_only');
      toast.success('Cleared chat text for you (media preserved)');
    } else if (option === 'media_only') {
      clearChatOption('media_only');
      toast.success('Cleared media for you (chat text preserved)');
    } else if (option === 'everything') {
      clearChatOption('everything');
      toast.success('Cleared chat for you (shared history preserved for class)');
    }
  };

  const handleToggleMute = () => {
    toggleMute();
    toast.info(isMuted ? `Unmuted ${subjectName} notifications` : `Muted ${subjectName} notifications`);
  };

  const conversationForDetails: ChatConversation = useMemo(() => ({
    id: subjectId,
    type: conversationType,
    name: subjectName,
    subtitle: isPersonal ? (role ? `Role: ${role}` : 'Personal Chat') : `${facultyAbb || ''} • ${facultyName || ''}`,
    avatarUrl,
    avatarType: avatarType || (isPersonal ? 'preset' : 'initials'),
    avatarPresetId,
    avatarEmoji,
    color,
    unreadCount: 0,
    lastActivityTimestamp: new Date().toISOString(),
    facultyName,
    facultyAbb,
    room,
    code: subjectCode,
    bio,
    role,
    onlineStatus,
  }), [
    subjectId,
    conversationType,
    subjectName,
    isPersonal,
    role,
    facultyAbb,
    facultyName,
    avatarUrl,
    avatarType,
    avatarPresetId,
    avatarEmoji,
    color,
    room,
    subjectCode,
    bio,
    onlineStatus,
  ]);

  return (
    <div className="flex h-full w-full bg-[#050B16] overflow-hidden select-text relative">
      {/* Center Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* WhatsApp-Style Chat Header */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 bg-[#070E1B]/95 backdrop-blur-md flex flex-col gap-2 pt-[calc(0.6rem+env(safe-area-inset-top,0px))] sm:pt-3 shrink-0 z-20">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Back Button */}
              <Link
                href={effectiveBackHref}
                title="Back"
                className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              {/* Avatar or Subject Accent Icon */}
              <div 
                onClick={() => setIsGroupInfoOpen(true)}
                className="relative shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isPersonal ? (
                  <>
                    <UserAvatar
                      name={subjectName}
                      avatarUrl={avatarUrl}
                      avatarType={avatarType || 'preset'}
                      avatarPresetId={avatarPresetId}
                      avatarEmoji={avatarEmoji}
                      size="md"
                      className="w-10 h-10 rounded-2xl ring-1 ring-white/10"
                    />
                    {onlineStatus === 'online' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070E1B]" />
                    )}
                  </>
                ) : (
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ring-1 ring-white/10"
                    style={{
                      backgroundColor: color ? `${color}25` : 'rgba(59, 130, 246, 0.2)',
                      color: color || '#3B82F6',
                      border: `1px solid ${color ? `${color}40` : 'rgba(59, 130, 246, 0.3)'}`,
                    }}
                  >
                    {facultyAbb ? facultyAbb.slice(0, 3) : <Users className="w-5 h-5" />}
                  </div>
                )}
              </div>

              {/* Title & Status Subtitle */}
              <div 
                onClick={() => setIsGroupInfoOpen(true)}
                className="min-w-0 flex flex-col cursor-pointer"
              >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-foreground truncate">
                  {subjectName}
                </h1>
                {!isPersonal && subjectCode && (
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/5 text-muted-foreground rounded-md border border-white/5">
                    {subjectCode}
                  </span>
                )}
                {!isPersonal && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                {isPersonal ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    online
                  </span>
                ) : (
                  <>
                    <span className="truncate">{facultyName || academicContext}</span>
                    {facultyAbb && (
                      <span className="font-mono text-primary font-medium hidden sm:inline">
                        [{facultyAbb}]
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* MOBILE ONLY: Context Menu Button (⋮) */}
            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileActionsOpen((prev) => !prev)}
                title="Chat actions"
                className={`h-9 w-9 rounded-xl transition-all cursor-pointer ${
                  isMobileActionsOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>

              {/* Mobile Context Dropdown */}
              {isMobileActionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#070E1B] backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-bold text-foreground">{subjectName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isPersonal ? 'Personal Chat Controls' : 'Subject Chat Controls'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen((prev) => !prev);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-primary" />
                    <span>Search Messages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPinnedOnly((prev) => !prev);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Pin className="w-4 h-4 text-amber-400" />
                    <span>{showPinnedOnly ? 'Show All Messages' : 'Show Pinned Only'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleToggleMute();
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-primary" />}
                    <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGroupInfoOpen(true);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-primary" />
                    <span>{isPersonal ? 'Contact Info' : 'Group Info'}</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteMenuOpen((prev) => !prev);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span>Clear Chat (for me only)...</span>
                  </button>
                </div>
              )}
            </div>

            {/* DESKTOP ONLY: Dedicated Quick Action Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                title="Search messages in this chat"
                className={`h-9 w-9 rounded-xl transition-colors cursor-pointer ${
                  isSearchOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Pinned Filter */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                title={showPinnedOnly ? 'Show all messages' : 'Show pinned messages'}
                className={`h-9 w-9 rounded-xl transition-colors cursor-pointer ${
                  showPinnedOnly ? 'bg-amber-500/15 text-amber-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Pin className="w-4 h-4" />
              </Button>

              {/* Mute Notifications */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
              </Button>

              {/* Group / Contact Info */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsGroupInfoOpen((prev) => !prev)}
                title={isPersonal ? 'Contact Info' : 'Group Info'}
                className={cn(
                  "h-9 w-9 rounded-xl transition-colors cursor-pointer",
                  isGroupInfoOpen ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Info className="w-4 h-4" />
              </Button>

              {/* Clear Chat Menu */}
              <div className="relative" ref={deleteMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteMenuOpen((prev) => !prev)}
                  title="Clear Chat Options"
                  className={`h-9 w-9 rounded-xl transition-colors cursor-pointer ${
                    isDeleteMenuOpen
                      ? 'bg-destructive/15 text-destructive'
                      : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                {/* Dropdown with 3 options */}
                {isDeleteMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#070E1B] backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-bold text-foreground">Clear Chat (Personal View)</p>
                      <p className="text-[11px] text-muted-foreground">
                        Clears messages on your device without deleting shared class records
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClearOption('chat_only')}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 shrink-0 mt-0.5">
                        <MessageSquareText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          1. Clear text messages only
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Removes text messages, keeps shared media & files
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleClearOption('media_only')}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 shrink-0 mt-0.5">
                        <FileImage className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                          2. Clear media files only
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Removes photos & attachments, keeps text messages
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleClearOption('everything')}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-red-500/10 transition-colors cursor-pointer group border-t border-white/10 mt-1 pt-2"
                    >
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-400 group-hover:text-red-300 transition-colors">
                          3. Clear everything (for me)
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Clears all messages & media from your personal view
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* In-chat search bar if active */}
        {isSearchOpen && (
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 mt-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search messages in ${subjectName}...`}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* WhatsApp-Style Pinned Message Banner */}
        {pinnedMessage && !isSearchOpen && (
          <div
            onClick={() => {
              toast.info(`Pinned notice: "${pinnedMessage.content}"`, {
                duration: 4000,
              });
            }}
            className="px-3.5 py-1.5 bg-[#091324] border-t border-white/5 flex items-center justify-between text-xs text-foreground cursor-pointer hover:bg-primary/10 transition-colors shrink-0 select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Pin className="w-3.5 h-3.5 text-primary rotate-45 shrink-0" />
              <span className="font-semibold text-primary shrink-0 text-[11px]">Pinned:</span>
              <span className="text-foreground/90 truncate text-[11px]">{pinnedMessage.content}</span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 ml-2 font-medium">Notice &rarr;</span>
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-hidden relative">
        <MessageList
          messages={displayedMessages}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          loadMore={loadMore}
          onReply={setReplyTo}
          subjectName={subjectName}
        />
      </div>

        {/* Message Composer */}
        <MessageInput
          subjectId={subjectId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onMessageSent={appendMessage}
        />
      </div>

      {/* Desktop 3-Panel Layout (>= 1280px): Inline third panel alongside active conversation */}
      {isGroupInfoOpen && groupInfoData && (
        <div className="hidden xl:flex w-[350px] 2xl:w-[380px] h-full shrink-0 border-l border-white/10 z-20 animate-in slide-in-from-right duration-200">
          <GroupInfoPanel
            data={groupInfoData}
            onClose={() => setIsGroupInfoOpen(false)}
            onTriggerSearch={() => setIsSearchOpen(true)}
            onToggleMute={handleToggleMute}
            onClearChat={handleClearOption}
            isMuted={isMuted}
          />
        </div>
      )}

      {/* Small Desktop (1024px - 1279px): Floating side panel to prevent squeezing conversation */}
      {isGroupInfoOpen && groupInfoData && (
        <div className="hidden lg:flex xl:hidden absolute right-0 top-0 bottom-0 w-[380px] max-w-full h-full z-30 bg-[#050B16] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-200">
          <GroupInfoPanel
            data={groupInfoData}
            onClose={() => setIsGroupInfoOpen(false)}
            onTriggerSearch={() => setIsSearchOpen(true)}
            onToggleMute={handleToggleMute}
            onClearChat={handleClearOption}
            isMuted={isMuted}
          />
        </div>
      )}

      {/* Mobile Full-Screen View (< 1024px): Group Info full page */}
      {isGroupInfoOpen && groupInfoData && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#050B16] overflow-hidden animate-in slide-in-from-right duration-200">
          <GroupInfoPanel
            data={groupInfoData}
            onClose={() => setIsGroupInfoOpen(false)}
            onTriggerSearch={() => {
              setIsGroupInfoOpen(false);
              setIsSearchOpen(true);
            }}
            onToggleMute={handleToggleMute}
            onClearChat={handleClearOption}
            isMuted={isMuted}
            isMobileFullPage={true}
          />
        </div>
      )}
    </div>
  );
}

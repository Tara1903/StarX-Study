"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { usePresence } from '@/hooks/use-presence';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
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
import type { MessageWithSender } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [showSubjectInfo, setShowSubjectInfo] = useState(false);
  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  const handleClearOption = (option: 'chat_only' | 'media_only' | 'everything') => {
    setIsDeleteMenuOpen(false);
    if (option === 'chat_only') {
      clearChatOption('chat_only');
      toast.success('Cleared chat only (media preserved)');
    } else if (option === 'media_only') {
      clearChatOption('media_only');
      toast.success('Cleared media only (chat text preserved)');
    } else if (option === 'everything') {
      clearChatOption('everything');
      toast.success('Cleared everything in this subject chat');
    }
  };

  const handleToggleMute = () => {
    toggleMute();
    toast.info(isMuted ? `Unmuted ${subjectName} notifications` : `Muted ${subjectName} notifications`);
  };

  return (
    <div className="flex flex-col h-full bg-background border-0 sm:border sm:border-border/80 rounded-none sm:rounded-2xl overflow-hidden shadow-none sm:shadow-xl">
      {/* Subject Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/80 bg-card/95 backdrop-blur-md flex flex-col gap-2 pt-[calc(0.6rem+env(safe-area-inset-top,0px))] sm:pt-3 shrink-0 z-20">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={`/subjects/${subjectId}`}
              title="Back to Subject Overview"
              className="p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div
              className="w-3 sm:w-3.5 h-9 sm:h-10 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-foreground truncate">
                  {subjectName}
                </h1>
                {subjectCode && (
                  <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground rounded-md border border-border">
                    {subjectCode}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                <span className="truncate">{facultyName || academicContext}</span>
                {facultyAbb && (
                  <span className="font-mono text-primary font-medium hidden sm:inline">
                    [{facultyAbb}]
                  </span>
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
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-bold text-foreground">{subjectName}</p>
                    <p className="text-[10px] text-muted-foreground">Subject Chat Controls</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen((prev) => !prev);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                  >
                    {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-primary" />}
                    <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSubjectInfo((prev) => !prev);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <Info className="w-4 h-4 text-primary" />
                    <span>Subject Information</span>
                  </button>

                  <div className="border-t border-border/60 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteMenuOpen((prev) => !prev);
                      setIsMobileActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span>Clear Chat Options...</span>
                  </button>
                </div>
              )}
            </div>

            {/* DESKTOP ONLY: 5 Dedicated Quick Action Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                title="Search messages in this subject"
                className={`h-9 w-9 rounded-lg transition-colors ${
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
                className={`h-9 w-9 rounded-lg transition-colors ${
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
                title={isMuted ? 'Unmute Subject' : 'Mute Subject'}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
              >
                {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
              </Button>

              {/* Subject Info Drawer */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubjectInfo(!showSubjectInfo)}
                title="Subject Details"
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Info className="w-4 h-4" />
              </Button>

              {/* Delete Chat Dropdown Menu */}
              <div className="relative" ref={deleteMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteMenuOpen((prev) => !prev)}
                  title="Delete Chat options"
                  className={`h-9 w-9 rounded-lg transition-colors ${
                    isDeleteMenuOpen
                      ? 'bg-destructive/15 text-destructive'
                      : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                {/* Dropdown with 3 options */}
              {isDeleteMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-bold text-foreground">Clear Chat Options</p>
                    <p className="text-[11px] text-muted-foreground">Select what you want to remove</p>
                  </div>

                  {/* Option 1: Clear chat only */}
                  <button
                    type="button"
                    onClick={() => handleClearOption('chat_only')}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-muted/80 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 shrink-0 mt-0.5">
                      <MessageSquareText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        1. Clear chat only
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Removes text messages, keeps shared media & files
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Clear media only */}
                  <button
                    type="button"
                    onClick={() => handleClearOption('media_only')}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-muted/80 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 shrink-0 mt-0.5">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                        2. Clear media only
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Removes photos & attachments, keeps text messages
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Clear everything */}
                  <button
                    type="button"
                    onClick={() => handleClearOption('everything')}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-red-500/10 transition-colors cursor-pointer group border-t border-border/60 mt-1 pt-2"
                  >
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 shrink-0 mt-0.5">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-red-400 group-hover:text-red-300 transition-colors">
                        3. Clear everything
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Deletes all messages and media in this subject
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
          <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border border-border mt-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search messages inside ${subjectName}...`}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
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

        {/* Subject Info Card */}
        {showSubjectInfo && (
          <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs flex flex-wrap items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Classroom:</span>
              <span className="text-muted-foreground">{room}</span>
              <span className="text-border">•</span>
              <span className="font-semibold text-foreground">Teacher:</span>
              <span className="text-muted-foreground">{facultyName || 'Department Faculty'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{Math.max(onlineUsers.length, 1)} participant{onlineUsers.length === 1 ? '' : 's'} online</span>
            </div>
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
  );
}

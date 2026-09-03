"use client";

import { useState, useMemo } from 'react';
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
  ShieldCheck, 
  Sparkles,
  X,
  Info
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
    clearChatForMe, 
    isMuted, 
    toggleMute 
  } = useRealtimeMessages(subjectId, subjectUuid);

  const { onlineUsers } = usePresence(subjectId);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showSubjectInfo, setShowSubjectInfo] = useState(false);

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

  const handleClearChat = () => {
    if (window.confirm('Clear chat history on this device? Shared messages for other participants will not be affected.')) {
      clearChatForMe();
      toast.success('Chat cleared for your account.');
    }
  };

  const handleToggleMute = () => {
    toggleMute();
    toast.info(isMuted ? `Unmuted ${subjectName} notifications` : `Muted ${subjectName} notifications`);
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Subject Header */}
      <div className="px-4 py-3 border-b border-border/80 bg-card/90 backdrop-blur-md flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/subjects/${subjectId}`}
              title="Back to Subject Overview"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div
              className="w-3.5 h-10 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-foreground truncate">
                  {subjectName}
                </h1>
                {subjectCode && (
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground rounded-md border border-border">
                    {subjectCode}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Chat
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                <span className="truncate">{academicContext}</span>
                {facultyName && (
                  <>
                    <span className="text-border">•</span>
                    <span className="truncate hidden md:inline text-foreground/80 font-medium">
                      {facultyName} {facultyAbb ? `[${facultyAbb}]` : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
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

            {/* Clear Chat For Me */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              title="Clear chat for me"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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

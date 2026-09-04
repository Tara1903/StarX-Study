"use client";
import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageItem } from './message-item';
import type { MessageWithSender } from '@/types';
import { Loader2, MessageSquare, ChevronDown } from 'lucide-react';

interface MessageListProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onReply: (message: MessageWithSender) => void;
  subjectName?: string;
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'TODAY';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

  return date
    .toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
    .toUpperCase();
}

export function MessageList({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  loadMore,
  onReply,
  subjectName,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);
  const prevCountRef = useRef(messages.length);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 10,
    getItemKey: (index) => messages[index]?.id || index,
  });

  // Track incoming messages and handle "↓ new messages" indicator
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    if (messages.length > prevCountRef.current) {
      const added = messages.length - prevCountRef.current;
      // In column-reverse, scrollTop === 0 is the bottom
      const isAtBottom = Math.abs(parent.scrollTop) < 40;
      if (!isAtBottom) {
        setNewMessagesBelow((prev) => prev + added);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      // If user scrolls back to bottom (0 in column-reverse)
      if (Math.abs(parent.scrollTop) < 30) {
        setNewMessagesBelow(0);
      }
      if (parent.scrollTop === 0 && hasMore && !isLoadingMore) {
        loadMore();
      }
    };

    parent.addEventListener('scroll', handleScroll, { passive: true });
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMore]);

  const scrollToBottom = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setNewMessagesBelow(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Send the first message to start the conversation in {subjectName || 'this chat'}.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden flex flex-col">
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 flex flex-col gap-1 select-text"
        style={{ display: 'flex', flexDirection: 'column-reverse' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            // Since messages is newest first, the previous message in chronological time is at index + 1
            const previousMsgInTime = messages[virtualItem.index + 1];
            const isContinuation =
              Boolean(previousMsgInTime) &&
              previousMsgInTime.sender_id === message.sender_id &&
              Math.abs(
                new Date(message.created_at).getTime() -
                  new Date(previousMsgInTime.created_at).getTime()
              ) < 5 * 60 * 1000;
            const showSenderInfo = !isContinuation;

            // Day separator: if previous message in time is from a different calendar day, or this is the oldest message
            const isFirstOfDay =
              !previousMsgInTime ||
              new Date(message.created_at).toDateString() !==
                new Date(previousMsgInTime.created_at).toDateString();

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {/* Subtle WhatsApp-style Date Separator */}
                {isFirstOfDay && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-white/5 border border-white/10 text-muted-foreground/80 shadow-xs uppercase">
                      {formatDateSeparator(message.created_at)}
                    </span>
                  </div>
                )}

                <MessageItem
                  message={message}
                  onReply={() => onReply(message)}
                  subjectName={subjectName}
                  showSenderInfo={showSenderInfo}
                />
              </div>
            );
          })}
        </div>

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Floating "↓ new messages" button (WhatsApp UX) */}
      {newMessagesBelow > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
        >
          <ChevronDown className="w-4 h-4 animate-bounce" />
          <span>
            {newMessagesBelow} new message{newMessagesBelow > 1 ? 's' : ''}
          </span>
        </button>
      )}
    </div>
  );
}

"use client";
import { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
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
  const hasInitialScrolledRef = useRef(false);
  const currentSubjectRef = useRef(subjectName);
  const isPrependRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const wasNearBottomRef = useRef(true);

  // If conversation room / subject changes, reset initial scroll flag
  if (currentSubjectRef.current !== subjectName) {
    currentSubjectRef.current = subjectName;
    hasInitialScrolledRef.current = false;
    wasNearBottomRef.current = true;
  }

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 12,
    getItemKey: (index) => messages[index]?.id || index,
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: parentRef.current.scrollHeight,
        behavior,
      });
      setNewMessagesBelow(0);
    }
  }, []);

  // 1. Initial scroll to bottom on first load
  useLayoutEffect(() => {
    if (!isLoading && messages.length > 0 && !hasInitialScrolledRef.current) {
      if (parentRef.current) {
        parentRef.current.scrollTop = parentRef.current.scrollHeight;
      }
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      hasInitialScrolledRef.current = true;
      prevCountRef.current = messages.length;
    }
  }, [isLoading, messages.length, virtualizer]);

  // 2. Scroll anchoring when older messages are prepended at the top
  useLayoutEffect(() => {
    if (isPrependRef.current && parentRef.current) {
      const newScrollHeight = parentRef.current.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      parentRef.current.scrollTop = prevScrollTopRef.current + heightDiff;
      isPrependRef.current = false;
    }
  }, [messages.length]);

  // 3. Track incoming appended messages and auto-scroll if user was already at the bottom
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent || !hasInitialScrolledRef.current) return;

    if (messages.length > prevCountRef.current) {
      const added = messages.length - prevCountRef.current;

      // Only handle if it was an append (not prepend from loadMore)
      if (!isPrependRef.current) {
        if (wasNearBottomRef.current) {
          // Keep user at the bottom smoothly
          requestAnimationFrame(() => {
            if (parentRef.current) {
              parentRef.current.scrollTop = parentRef.current.scrollHeight;
            }
          });
        } else {
          // User is scrolled up reading history; show "↓ new messages" indicator
          setNewMessagesBelow((prev) => prev + added);
        }
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  // 4. Scroll listener for scroll-up pagination and clearing new-messages badge
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      const distFromBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight;
      wasNearBottomRef.current = distFromBottom < 100;

      if (distFromBottom < 40) {
        setNewMessagesBelow(0);
      }

      // When user scrolls near top, trigger loading older history
      if (parent.scrollTop < 60 && hasMore && !isLoadingMore && !isPrependRef.current) {
        isPrependRef.current = true;
        prevScrollHeightRef.current = parent.scrollHeight;
        prevScrollTopRef.current = parent.scrollTop;
        loadMore();
      }
    };

    parent.addEventListener('scroll', handleScroll, { passive: true });
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMore]);

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
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 select-text relative"
      >
        {/* Older message loading spinner at the top */}
        {isLoadingMore && (
          <div className="flex justify-center py-2 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Virtualized messages container: top to bottom chronological */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            if (!message) return null;

            // In chronological oldest-to-newest, previous message in time is at index - 1
            const previousMsgInTime = virtualItem.index > 0 ? messages[virtualItem.index - 1] : null;

            // Date separator if first message ever, or date differs from previous message
            const isFirstOfDay =
              !previousMsgInTime ||
              new Date(message.created_at).toDateString() !==
                new Date(previousMsgInTime.created_at).toDateString();

            // Continuation if same sender within 5 mins on same day
            const isContinuation =
              previousMsgInTime !== null &&
              previousMsgInTime.sender_id === message.sender_id &&
              Math.abs(
                new Date(message.created_at).getTime() -
                  new Date(previousMsgInTime.created_at).getTime()
              ) < 5 * 60 * 1000 &&
              !isFirstOfDay;

            const showSenderInfo = !isContinuation;

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
                {/* Subtle WhatsApp-style Date Separator above the day's messages */}
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
      </div>

      {/* Floating "↓ new messages" button (WhatsApp UX) */}
      {newMessagesBelow > 0 && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
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

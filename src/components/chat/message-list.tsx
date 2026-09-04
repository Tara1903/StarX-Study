"use client";
import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageItem } from './message-item';
import type { MessageWithSender } from '@/types';
import { Loader2, MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onReply: (message: MessageWithSender) => void;
  subjectName?: string;
}

export function MessageList({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  loadMore,
  onReply,
  subjectName
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 10,
    getItemKey: (index) => messages[index]?.id || index,
  });

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      if (parent.scrollTop === 0 && hasMore && !isLoadingMore) {
        loadMore();
      }
    };

    parent.addEventListener('scroll', handleScroll);
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
        <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Send the first message to start the discussion in {subjectName || 'this subject'}.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1"
      style={{ display: 'flex', flexDirection: 'column-reverse' }}
    >
      <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          // Since messages is newest first, the previous message in chronological time is at index + 1
          const previousMsgInTime = messages[virtualItem.index + 1];
          const isContinuation =
            Boolean(previousMsgInTime) &&
            previousMsgInTime.sender_id === message.sender_id &&
            Math.abs(new Date(message.created_at).getTime() - new Date(previousMsgInTime.created_at).getTime()) < 5 * 60 * 1000;
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
  );
}

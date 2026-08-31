"use client";
import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageItem } from './message-item';
import type { MessageWithSender } from '@/types';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MessageListProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onReply: (message: MessageWithSender) => void;
}

export function MessageList({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  loadMore,
  onReply
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
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

  // Messages are newest first, so we reverse for rendering
  const reversedMessages = [...messages].reverse();

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
      style={{ display: 'flex', flexDirection: 'column-reverse' }}
    >
      <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index]; // Use original order since container is column-reverse
          
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
              <MessageItem message={message} onReply={() => onReply(message)} />
            </div>
          );
        })}
      </div>
      
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

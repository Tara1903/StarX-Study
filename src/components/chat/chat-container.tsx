"use client";
import { useState } from 'react';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { usePresence } from '@/hooks/use-presence';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { Users, Pin } from 'lucide-react';
import type { MessageWithSender } from '@/types';
import { Button } from '@/components/ui/button';

interface ChatContainerProps {
  subjectId: string;
  subjectName: string;
}

export function ChatContainer({ subjectId, subjectName }: ChatContainerProps) {
  const { messages, isLoading, isLoadingMore, hasMore, loadMore } = useRealtimeMessages(subjectId);
  const { onlineUsers } = usePresence(subjectId);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-card">
        <div>
          <h2 className="font-semibold text-lg">{subjectName}</h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            {onlineUsers.length} online
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Pin className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Users className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        loadMore={loadMore}
        onReply={setReplyTo}
      />

      {/* Input */}
      <MessageInput
        subjectId={subjectId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}

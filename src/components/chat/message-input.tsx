// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MessageWithSender } from '@/types';
import { sendMessage } from '@/actions/messages';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';
import { TypingIndicator } from './typing-indicator';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';

interface MessageInputProps {
  subjectId: string;
  replyTo: MessageWithSender | null;
  onCancelReply: () => void;
}

export function MessageInput({ subjectId, replyTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useUser();
  const { typingUsers, sendTypingEvent } = useTypingIndicator(subjectId);

  const isRestricted = profile?.status === 'suspended' || profile?.status === 'restricted';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isSubmitting || isRestricted) return;

    try {
      setIsSubmitting(true);
      const result = await sendMessage(subjectId, content.trim(), replyTo?.id);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setContent('');
      onCancelReply();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    sendTypingEvent();
  };

  return (
    <div className="p-4 border-t bg-background">
      {replyTo && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-t-md border-l-4 border-primary text-sm mb-2">
          <div className="truncate">
            <span className="font-semibold">{replyTo.sender?.full_name}:</span> {replyTo.content}
          </div>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
        <Button type="button" size="icon" variant="ghost" className="shrink-0 rounded-full h-10 w-10 text-muted-foreground" disabled={isRestricted}>
          <Paperclip className="w-5 h-5" />
        </Button>
        
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isRestricted ? "You are restricted from messaging" : "Type a message..."}
          disabled={isRestricted || isSubmitting}
          className="min-h-[40px] max-h-[120px] resize-none rounded-2xl py-3 border-muted focus-visible:ring-1"
          rows={1}
        />
        
        <Button 
          type="submit" 
          size="icon" 
          className="shrink-0 rounded-full h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90" 
          disabled={!content.trim() || isSubmitting || isRestricted}
        >
          <SendHorizontal className="w-5 h-5" />
        </Button>
      </form>
      
      <TypingIndicator users={typingUsers} />
    </div>
  );
}


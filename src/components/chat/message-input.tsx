"use client";
import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
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
  onMessageSent?: (message: MessageWithSender) => void;
}

export function MessageInput({ subjectId, replyTo, onCancelReply, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string; type: string; size: number } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useUser();
  const { typingUsers, sendTypingEvent } = useTypingIndicator(subjectId);

  const isRestricted = (profile as any)?.status === 'suspended' || (profile as any)?.status === 'restricted';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10 MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        name: file.name,
        url: event.target?.result as string,
        type: file.type || 'application/octet-stream',
        size: file.size,
      });
      toast.success(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!content.trim() && !selectedFile) || isSubmitting || isRestricted) return;

    try {
      setIsSubmitting(true);
      const textToSend = content.trim() || (selectedFile ? `Shared file: ${selectedFile.name}` : '');
      const result = await sendMessage({
        subject_id: subjectId,
        content: textToSend,
        reply_to_id: replyTo?.id
      });
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data && onMessageSent) {
        const fullMsg: MessageWithSender = {
          ...(result.data as MessageWithSender),
          attachments: selectedFile ? [
            {
              id: `att_${Date.now()}`,
              message_id: result.data.id,
              file_name: selectedFile.name,
              file_type: selectedFile.type,
              file_size: selectedFile.size,
              storage_path: selectedFile.url,
              created_at: new Date().toISOString(),
            }
          ] : [],
        };
        onMessageSent(fullMsg);
      }
      
      setContent('');
      setSelectedFile(null);
      onCancelReply();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
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
    <div className="p-3 sm:p-4 border-t border-border/80 bg-background/95 backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sticky bottom-0 z-20">
      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between bg-muted/80 px-3 py-2 rounded-xl border-l-4 border-primary text-xs mb-2 shadow-sm">
          <div className="truncate">
            <span className="font-semibold text-foreground">{replyTo.sender?.full_name}:</span> {replyTo.content}
          </div>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected File Preview Banner */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl text-xs mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {selectedFile.type.includes('image') ? (
              <img src={selectedFile.url} alt="preview" className="w-6 h-6 object-cover rounded-md shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="font-medium text-foreground truncate">{selectedFile.name}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        {/* Paperclip button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image or document"
          className="shrink-0 rounded-xl h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          disabled={isRestricted}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        
        {/* Message Input */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isRestricted ? "You are restricted from messaging" : "Type a message or share an image..."}
          disabled={isRestricted || isSubmitting}
          className="min-h-[40px] max-h-[120px] resize-none rounded-2xl py-2.5 px-3.5 text-xs sm:text-sm border-muted focus-visible:ring-1"
          rows={1}
        />
        
        {/* Send Button */}
        <Button 
          type="submit" 
          size="icon" 
          className="shrink-0 rounded-xl h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm" 
          disabled={(!content.trim() && !selectedFile) || isSubmitting || isRestricted}
        >
          <SendHorizontal className="w-4 h-4" />
        </Button>
      </form>
      
      <TypingIndicator users={typingUsers} />
    </div>
  );
}

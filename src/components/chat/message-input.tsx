"use client";
import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MessageWithSender } from '@/types';
import { sendMessage } from '@/actions/messages';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';
import { TypingIndicator } from './typing-indicator';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { createClient } from '@/lib/supabase/client';

import { sanitizeFileName, validateAttachment } from '@/lib/security';

interface MessageInputProps {
  subjectId: string;
  replyTo: MessageWithSender | null;
  onCancelReply: () => void;
  onMessageSent?: (message: MessageWithSender) => void;
}

export function MessageInput({ subjectId, replyTo, onCancelReply, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File; name: string; url: string; type: string; size: number } | null>(null);
  
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

    // Validate size and file extension / type using security utility
    const validation = validateAttachment({
      name: file.name,
      size: file.size,
      type: file.type,
      maxSizeBytes: 15 * 1024 * 1024, // 15 MB limit
    });

    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file format or size');
      e.target.value = '';
      return;
    }

    const safeName = sanitizeFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        file,
        name: safeName,
        url: event.target?.result as string,
        type: file.type || 'application/octet-stream',
        size: file.size,
      });
      toast.success(`Attached: ${safeName}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!content.trim() && !selectedFile) || isSubmitting || isUploading || isRestricted) return;

    try {
      setIsSubmitting(true);
      let attachmentsPayload: Array<{
        file_name: string;
        file_type: string;
        file_size: number;
        storage_path: string;
      }> = [];

      if (selectedFile) {
        setIsUploading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || profile?.id || 'anonymous';
        const fileExt = selectedFile.name.split('.').pop() || '';
        const cleanExt = fileExt ? `.${fileExt}` : '';
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
        const storagePath = `${userId}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(storagePath, selectedFile.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          toast.error(`Failed to upload attachment: ${uploadError.message}`);
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(storagePath);

        attachmentsPayload = [
          {
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_size: selectedFile.size,
            storage_path: publicUrlData?.publicUrl || storagePath,
          },
        ];
        setIsUploading(false);
      }

      const textToSend = content.trim() || (selectedFile ? `Shared file: ${selectedFile.name}` : '');
      const result = await sendMessage({
        subject_id: subjectId,
        content: textToSend,
        reply_to_id: replyTo?.id,
        attachments: attachmentsPayload,
      });
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data && onMessageSent) {
        onMessageSent(result.data as MessageWithSender);
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
      setIsUploading(false);
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
    <div className="p-2.5 sm:p-4 border-t border-white/10 bg-[#050B16]/95 backdrop-blur-md pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sticky bottom-0 z-20">
      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between bg-[#070E1B] border border-white/10 px-3 py-1.5 rounded-xl border-l-3 border-l-[#168BFF] text-xs mb-2 shadow-sm">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-semibold text-[#168BFF] block truncate">
              Replying to {replyTo.sender?.full_name || 'User'}
            </span>
            <p className="text-xs text-muted-foreground truncate">
              “{replyTo.content}”
            </p>
          </div>
          <button 
            type="button"
            onClick={onCancelReply} 
            aria-label="Cancel reply"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected File Preview Banner */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-xs mb-2">
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
            aria-label="Remove attached file"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-95 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2 relative">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        {/* Paperclip button - 44px+ touch target */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image or document"
          className="shrink-0 rounded-xl h-11 w-11 sm:h-10 sm:w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
          disabled={isRestricted}
        >
          <Paperclip className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>
        
        {/* Message Input */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isRestricted ? "Messaging is restricted" : "Type a message..."}
          disabled={isRestricted || isSubmitting}
          className="min-h-[44px] sm:min-h-[40px] max-h-[120px] resize-none rounded-2xl py-2.5 px-3.5 text-sm border-white/10 bg-white/5 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/60 transition-colors"
          rows={1}
        />
        
        {/* Send Button - 44px+ touch target */}
        <Button 
          type="submit" 
          size="icon" 
          className="shrink-0 rounded-xl h-11 w-11 sm:h-10 sm:w-10 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shadow-md" 
          disabled={(!content.trim() && !selectedFile) || isSubmitting || isUploading || isRestricted}
        >
          {isSubmitting || isUploading ? (
            <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5 sm:w-4 sm:h-4" />
          )}
        </Button>
      </form>
      
      <TypingIndicator users={typingUsers} />
    </div>
  );
}

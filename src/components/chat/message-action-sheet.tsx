'use client';

import { useEffect } from 'react';
import { 
  Reply, 
  Copy, 
  Bookmark, 
  BookmarkCheck, 
  Pin, 
  Trash2, 
  Flag, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  senderName: string;
  isSaved?: boolean;
  canPin?: boolean;
  isPinned?: boolean;
  canDelete?: boolean;
  isOwn?: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onSaveMedia?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '👀', '✅'];

export function MessageActionSheet({
  isOpen,
  onClose,
  messageContent,
  senderName,
  isSaved = false,
  canPin = false,
  isPinned = false,
  canDelete = false,
  isOwn = false,
  onReact,
  onReply,
  onSaveMedia,
  onPin,
  onDelete,
  onReport,
}: MessageActionSheetProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      toast.success('Message copied to clipboard');
    } catch {
      toast.error('Failed to copy text');
    }
    onClose();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Message Actions"
      className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Action Sheet Container */}
      <div 
        className="relative z-10 w-full max-w-lg mx-auto bg-[#070E1B] border-t border-white/10 rounded-t-2xl shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-col animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto"
      >
        {/* Grabber Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Message Preview */}
        <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-primary block truncate">
              {senderName}
            </span>
            <p className="text-xs text-muted-foreground truncate">
              {messageContent || 'Shared attachment'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="Dismiss actions"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Reaction Bar */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-around gap-1 bg-white/[0.02]">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 active:scale-125 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Action Items List */}
        <div className="p-2 space-y-1">
          {/* Reply */}
          <button
            type="button"
            onClick={() => {
              onReply();
              onClose();
            }}
            className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-foreground hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
          >
            <Reply className="w-4 h-4 text-primary" />
            <span>Reply</span>
          </button>

          {/* Copy Message */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-foreground hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
            <span>Copy Text</span>
          </button>

          {/* Store Media in Profile */}
          {onSaveMedia && (
            <button
              type="button"
              onClick={() => {
                onSaveMedia();
                onClose();
              }}
              className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-foreground hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Saved in Profile</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span>Save to Profile</span>
                </>
              )}
            </button>
          )}

          {/* Pin Message (Teachers/Admins) */}
          {canPin && onPin && (
            <button
              type="button"
              onClick={() => {
                onPin();
                onClose();
              }}
              className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-foreground hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-400' : 'text-muted-foreground'}`} />
              <span>{isPinned ? 'Unpin Message' : 'Pin Message'}</span>
            </button>
          )}

          {/* Report (Non-Author) */}
          {!isOwn && (
            <button
              type="button"
              onClick={() => {
                onReport?.();
                toast.info('Message reported to course moderators');
                onClose();
              }}
              className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-muted-foreground hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            >
              <Flag className="w-4 h-4 text-amber-500" />
              <span>Report Message</span>
            </button>
          )}

          {/* Delete (Author or Teacher) */}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Message</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

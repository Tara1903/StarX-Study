"use client";

import { useState, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import type { MessageWithSender } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { 
  Reply, 
  Pin, 
  Trash2, 
  Flag, 
  Bookmark, 
  BookmarkCheck, 
  FileText, 
  Image as ImageIcon,
  MoreHorizontal,
  Copy,
  CheckCheck
} from 'lucide-react';
import { toggleReaction, pinMessage, deleteMessage } from '@/actions/messages';
import { saveMediaItem, isMediaStored, removeStoredMediaItem } from '@/lib/stored-media';
import { toast } from 'sonner';
import { MessageActionSheet } from './message-action-sheet';
import { isSafeUrl } from '@/lib/security';

interface MessageItemProps {
  message: MessageWithSender;
  onReply: () => void;
  subjectName?: string;
  showSenderInfo?: boolean;
}

function formatMessageTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const MessageItem = memo(function MessageItem({ 
  message, 
  onReply, 
  subjectName = 'Subject',
  showSenderInfo = true 
}: MessageItemProps) {
  const { profile, activeRole } = useUser();
  const router = useRouter();
  const isOwn = profile?.id === message.sender_id;
  const isTeacher = activeRole === 'teacher' || activeRole === 'institute_head';

  const [storedMap, setStoredMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (message.attachments) {
      message.attachments.forEach((att) => {
        initial[att.id] = isMediaStored(att.storage_path || att.file_name);
      });
    }
    return initial;
  });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(40);
      }
      setIsSheetOpen(true);
    }, 400);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleReaction = async (emoji: string) => {
    await toggleReaction(message.id, emoji);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(message.id);
    }
  };

  const handlePin = async () => {
    await pinMessage(message.id);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleStoreAttachment = (att: any) => {
    const alreadySaved = storedMap[att.id];
    if (alreadySaved) {
      removeStoredMediaItem(att.id);
      setStoredMap((prev) => ({ ...prev, [att.id]: false }));
      toast.info('Removed from stored media');
    } else {
      const isImg = att.file_type?.includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.file_name);
      saveMediaItem({
        url: att.storage_path || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        name: att.file_name || 'Classroom_Resource.png',
        type: isImg ? 'image' : att.file_name?.endsWith('.pdf') ? 'pdf' : 'document',
        size: att.file_size ? `${(att.file_size / 1024 / 1024).toFixed(1)} MB` : '1.2 MB',
        subjectId: message.subject_id || undefined,
        subjectName: subjectName,
        senderName: message.sender?.full_name || 'Class Participant',
      });
      setStoredMap((prev) => ({ ...prev, [att.id]: true }));
      toast.success('Saved to your Profile Stored Media!', {
        action: {
          label: 'View in Profile',
          onClick: () => router.push('/profile'),
        },
      });
    }
  };

  // Helper to extract image URL from content if sent as link
  const rawImageUrl = message.content.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)/i)?.[0];
  const detectedImageUrl = rawImageUrl && isSafeUrl(rawImageUrl) ? rawImageUrl : null;

  const handleStoreDirectContent = () => {
    const url = detectedImageUrl || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80';
    const name = `${subjectName.replace(/\s+/g, '_')}_Shared_Note_${message.id.substring(0, 5)}.png`;
    
    saveMediaItem({
      url,
      name,
      type: 'image',
      size: '1.8 MB',
      subjectId: message.subject_id || undefined,
      subjectName,
      senderName: message.sender?.full_name || 'Class Participant',
    });

    toast.success('Resource saved to Profile Stored Media!', {
      action: {
        label: 'View in Profile',
        onClick: () => router.push('/profile'),
      },
    });
  };

  return (
    <div 
      className={cn(
        "group flex gap-2.5 max-w-[90%] sm:max-w-[78%]",
        showSenderInfo ? "mt-3" : "mt-0.5",
        isOwn ? "ml-auto flex-row-reverse" : ""
      )}
    >
      {/* Avatar (shown only on group start for other senders) */}
      {!isOwn && (
        showSenderInfo ? (
          <UserAvatar
            name={message.sender?.full_name || 'User'}
            avatarUrl={message.sender?.avatar_url}
            size="sm"
            className="shrink-0 mt-1 ring-1 ring-white/10"
          />
        ) : (
          <div className="w-8 h-8 shrink-0 invisible pointer-events-none" />
        )
      )}

      <div className={cn("flex flex-col gap-0.5 min-w-0", isOwn ? "items-end" : "items-start")}>
        {/* Sender Name (Shown only on first message of group for other senders) */}
        {!isOwn && showSenderInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mx-1 mb-0.5">
            <span className="font-semibold text-foreground/90 text-xs">
              {message.sender?.full_name || 'User'}
            </span>
            {message.is_pinned && <Pin className="w-3 h-3 text-primary rotate-45" />}
          </div>
        )}

        {/* Message Bubble Container */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          onContextMenu={(e) => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              e.preventDefault();
              setIsSheetOpen(true);
            }
          }}
          className={cn(
            "relative px-3 py-2 rounded-2xl whitespace-pre-wrap break-words text-sm shadow-sm transition-all select-none lg:select-text",
            isOwn 
              ? "bg-gradient-to-br from-primary to-blue-600 text-primary-foreground rounded-tr-xs shadow-md shadow-primary/10" 
              : "bg-[#091222] border border-white/10 rounded-tl-xs text-foreground shadow-sm"
          )}
        >
          {/* WhatsApp-Style Compact Reply Quote Reference */}
          {message.reply_to && (
            <div 
              onClick={onReply}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg border-l-3 mb-1.5 opacity-90 max-w-full truncate cursor-pointer transition-opacity hover:opacity-100",
                isOwn
                  ? "bg-black/25 border-white/80 text-white/90"
                  : "bg-white/5 border-primary text-foreground/90"
              )}
            >
              <span className={cn("font-bold text-[11px] block truncate", isOwn ? "text-cyan-200" : "text-primary")}>
                {message.reply_to.sender?.full_name || 'User'}
              </span>
              <span className="text-[11px] opacity-80 truncate block">
                {message.reply_to.content}
              </span>
            </div>
          )}

          {/* Main Text Content */}
          <div className="leading-relaxed text-[13.5px] sm:text-sm">{message.content}</div>

          {/* Bottom-right timestamp & status ticks */}
          <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5 text-[10px] select-none">
            {message.is_edited && (
              <span className={cn("text-[9px] italic mr-0.5", isOwn ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                edited
              </span>
            )}
            <span className={cn("font-medium", isOwn ? "text-primary-foreground/75" : "text-muted-foreground/70")}>
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && (
              <CheckCheck className="w-3.5 h-3.5 text-cyan-200 inline shrink-0" />
            )}
          </div>

          {/* Media Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att) => {
                const isImg = att.file_type?.includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.file_name);
                const isSaved = storedMap[att.id];

                return (
                  <div
                    key={att.id}
                    className="p-2 rounded-xl bg-background/80 border border-border/80 text-foreground flex flex-col gap-2"
                  >
                    {isImg ? (
                      <div className="relative group/img rounded-lg overflow-hidden max-h-56 bg-muted">
                        <img
                          src={att.storage_path || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'}
                          alt={att.file_name}
                          className="w-full h-auto object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-medium truncate flex-1">{att.file_name}</span>
                      </div>
                    )}

                    {/* Store Media in Profile Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                      <span className="text-[11px] text-muted-foreground truncate">{att.file_name}</span>
                      <button
                        type="button"
                        onClick={() => handleStoreAttachment(att)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3 h-3" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick detected image preview if sent as link */}
          {detectedImageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-border/60 bg-background/80 p-2">
              <img src={detectedImageUrl} alt="Shared attachment" className="rounded-lg max-h-52 w-full object-cover" />
              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground truncate">Shared Image</span>
                <button
                  type="button"
                  onClick={handleStoreDirectContent}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground transition-all cursor-pointer"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Hover Actions Toolbar */}
          <div className={cn(
            "absolute top-0 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border shadow-lg rounded-xl p-1 z-10",
            isOwn ? "right-full mr-2" : "left-full ml-2"
          )}>
            <button
              onClick={handleStoreDirectContent}
              title="Store this media in Profile"
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopyText}
              title="Copy text"
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onReply}
              title="Reply"
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            {isTeacher && (
              <button
                onClick={handlePin}
                title="Pin message"
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            )}
            {(isOwn || isTeacher) && (
              <button
                onClick={handleDelete}
                title="Delete message"
                className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isOwn && (
              <button
                title="Report"
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Message Reactions (Compact chips) */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {Object.entries(
              message.reactions.reduce((acc, curr) => {
                acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-xs bg-muted/70 hover:bg-muted px-2 py-0.5 rounded-full border border-border/60 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground text-[10px] font-semibold">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile More Options Button */}
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        aria-label="Message options"
        className="lg:hidden self-center p-1 rounded-lg text-muted-foreground/40 hover:text-foreground active:scale-95 transition-all shrink-0 cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Mobile Touch Action Sheet (only rendered when open) */}
      {isSheetOpen && (
        <MessageActionSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          messageContent={message.content}
          senderName={message.sender?.full_name || 'User'}
          isSaved={message.attachments?.some((att) => storedMap[att.id])}
          canPin={isTeacher}
          isPinned={!!message.is_pinned}
          canDelete={isOwn || isTeacher}
          isOwn={isOwn}
          onReact={handleReaction}
          onReply={onReply}
          onSaveMedia={handleStoreDirectContent}
          onPin={isTeacher ? handlePin : undefined}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
});

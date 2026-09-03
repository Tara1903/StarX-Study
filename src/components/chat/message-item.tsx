"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import type { MessageWithSender } from '@/types';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Reply, 
  Pin, 
  Trash2, 
  Flag, 
  Bookmark, 
  BookmarkCheck, 
  FileText, 
  Download, 
  FileIcon, 
  Image as ImageIcon 
} from 'lucide-react';
import { toggleReaction, pinMessage, deleteMessage } from '@/actions/messages';
import { saveMediaItem, isMediaStored, removeStoredMediaItem } from '@/lib/stored-media';
import { toast } from 'sonner';

interface MessageItemProps {
  message: MessageWithSender;
  onReply: () => void;
  subjectName?: string;
}

export function MessageItem({ message, onReply, subjectName = 'Subject' }: MessageItemProps) {
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
        subjectId: message.subject_id,
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
  const detectedImageUrl = message.content.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)/i)?.[0];

  const handleStoreDirectContent = () => {
    const url = detectedImageUrl || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80';
    const name = `${subjectName.replace(/\s+/g, '_')}_Shared_Note_${message.id.substring(0, 5)}.png`;
    
    saveMediaItem({
      url,
      name,
      type: 'image',
      size: '1.8 MB',
      subjectId: message.subject_id,
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
    <div className={cn("group flex gap-3 max-w-[85%] sm:max-w-[75%]", isOwn ? "ml-auto flex-row-reverse" : "")}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={message.sender?.avatar_url || ''} />
        <AvatarFallback>{getInitials(message.sender?.full_name || 'Unknown')}</AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mx-1">
          <span className="font-semibold text-foreground">{message.sender?.full_name || 'User'}</span>
          <span>{formatRelativeTime(new Date(message.created_at))}</span>
          {message.is_pinned && <Pin className="w-3 h-3 text-primary" />}
        </div>

        {message.reply_to && (
          <div className="text-xs bg-muted/80 p-2 rounded-lg border-l-2 border-primary mb-1 opacity-80 max-w-full truncate">
            <span className="font-semibold">{message.reply_to.sender?.full_name}: </span>
            {message.reply_to.content}
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "relative px-4 py-2.5 rounded-2xl whitespace-pre-wrap break-words text-sm shadow-sm",
          isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm text-foreground"
        )}>
          {/* Main Text Content */}
          <div>{message.content}</div>

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
                        <FileText className="w-5 h-5 text-primary shrink-0" />
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
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span>Stored in Profile</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Store Media</span>
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
                  <span>Store in App</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Hover Actions Toolbar */}
          <div className={cn(
            "absolute top-0 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border shadow-lg rounded-xl p-1 z-10",
            isOwn ? "right-full mr-2" : "left-full ml-2"
          )}>
            <button
              onClick={handleStoreDirectContent}
              title="Store this media/file in Profile"
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
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

        {/* Message Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(
              message.reactions.reduce((acc, curr) => {
                acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-full border border-border flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground text-[10px]">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

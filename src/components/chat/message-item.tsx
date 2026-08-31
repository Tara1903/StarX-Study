// @ts-nocheck
import { useUser } from '@/components/providers/user-provider';
import type { MessageWithSender } from '@/types';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Reply, Pin, Edit, Trash2, Flag } from 'lucide-react';
import { AVAILABLE_REACTIONS } from '@/lib/constants';
import { toggleReaction, pinMessage, deleteMessage } from '@/actions/messages';

interface MessageItemProps {
  message: MessageWithSender;
  onReply: () => void;
}

export function MessageItem({ message, onReply }: MessageItemProps) {
  const { profile } = useUser();
  const isOwn = profile?.id === message.sender_id;
  const isTeacher = profile?.role === 'TEACHER';

  const handleReaction = async (emoji: string) => {
    await toggleReaction({message_id: message.id, emoji});
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessage({message_id: message.id});
    }
  };

  const handlePin = async () => {
    await pinMessage(message.id, !message.is_pinned);
  };

  return (
    <div className={cn("group flex gap-3 max-w-[80%]", isOwn ? "ml-auto flex-row-reverse" : "")}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={message.sender?.avatar_url || ''} />
        <AvatarFallback>{getInitials(message.sender?.full_name || 'Unknown')}</AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mx-1">
          <span className="font-medium text-foreground">{message.sender?.full_name}</span>
          <span>{formatRelativeTime(new Date(message.created_at))}</span>
          {message.is_pinned && <Pin className="w-3 h-3 text-primary" />}
        </div>

        {message.reply_to && (
          <div className="text-xs bg-muted p-2 rounded-md border-l-2 border-primary mb-1 opacity-80 max-w-full truncate">
            <span className="font-medium">{message.reply_to.sender?.full_name}: </span>
            {message.reply_to.content}
          </div>
        )}

        <div className={cn(
          "relative px-4 py-2 rounded-2xl whitespace-pre-wrap break-words",
          isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
        )}>
          {message.content}
          
          <div className={cn(
            "absolute top-0 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-md p-1",
            isOwn ? "right-full mr-2" : "left-full ml-2"
          )}>
            <button onClick={onReply} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Reply className="w-4 h-4" /></button>
            {isTeacher && <button onClick={handlePin} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Pin className="w-4 h-4" /></button>}
            {(isOwn || isTeacher) && <button onClick={handleDelete} className="p-1 hover:bg-muted rounded text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>}
            {!isOwn && <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Flag className="w-4 h-4" /></button>}
          </div>
        </div>

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
                className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-full border flex items-center gap-1"
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


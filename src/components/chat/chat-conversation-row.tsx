import { memo } from 'react';
import Link from 'next/link';
import { Pin, BellOff, CheckCheck, Users } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { ChatConversation } from '@/lib/conversations';
import { cn } from '@/lib/utils';

interface ChatConversationRowProps {
  conversation: ChatConversation;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}

export const ChatConversationRow = memo(function ChatConversationRow({
  conversation,
  isActive = false,
  onClick,
  href,
}: ChatConversationRowProps) {
  const isSubject = conversation.type === 'subject';
  const targetHref = href || `/chat/${conversation.id}`;

  const content = (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer select-none text-left relative',
        isActive
          ? 'bg-primary/15 border border-primary/30 shadow-sm'
          : 'hover:bg-white/5 active:bg-white/10 border border-transparent'
      )}
    >
      {/* Active Left Indicator Bar on Desktop */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
      )}

      {/* Avatar or Subject Icon */}
      <div className="relative shrink-0">
        {isSubject ? (
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-white/10"
            style={{
              backgroundColor: conversation.color
                ? `${conversation.color}25`
                : 'rgba(59, 130, 246, 0.2)',
              color: conversation.color || '#3B82F6',
              border: `1px solid ${conversation.color ? `${conversation.color}40` : 'rgba(59, 130, 246, 0.3)'}`,
            }}
          >
            {conversation.facultyAbb ? (
              <span className="font-mono text-xs tracking-tight">
                {conversation.facultyAbb.slice(0, 3)}
              </span>
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
        ) : (
          <UserAvatar
            name={conversation.name}
            avatarUrl={conversation.avatarUrl}
            avatarType={conversation.avatarType || 'preset'}
            avatarPresetId={conversation.avatarPresetId}
            avatarEmoji={conversation.avatarEmoji}
            size="md"
            className="w-11 h-11 rounded-2xl ring-1 ring-white/10"
          />
        )}

        {/* Online Status Dot for personal */}
        {!isSubject && conversation.onlineStatus === 'online' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#050B16]" />
        )}
      </div>

      {/* Conversation Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'text-sm font-semibold truncate',
                isActive ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'
              )}
            >
              {conversation.name}
            </span>
            {isSubject && conversation.code && (
              <span className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-white/5 text-muted-foreground border border-white/5">
                {conversation.code}
              </span>
            )}
          </div>

          {/* Time */}
          {conversation.lastMessageTime && (
            <span
              className={cn(
                'text-[11px] shrink-0 font-medium',
                conversation.unreadCount > 0
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground/80'
              )}
            >
              {conversation.lastMessageTime}
            </span>
          )}
        </div>

        {/* Bottom preview line: Last message preview + badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1 min-w-0">
            {/* Sender prefix if group chat */}
            {isSubject && conversation.lastMessageSender && (
              <span className="font-medium text-foreground/75 shrink-0">
                {conversation.lastMessageSender}:
              </span>
            )}
            <span className="truncate">
              {conversation.lastMessage || 'No messages yet'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Muted indicator */}
            {conversation.isMuted && (
              <BellOff className="w-3.5 h-3.5 text-muted-foreground/60" />
            )}

            {/* Pinned indicator */}
            {conversation.isPinned && (
              <Pin className="w-3.5 h-3.5 text-muted-foreground/60 rotate-45" />
            )}

            {/* Unread Count Badge */}
            {conversation.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in-75">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return <Link href={targetHref} className="block">{content}</Link>;
});

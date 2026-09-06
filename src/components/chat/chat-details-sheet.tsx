'use client';

import { useState } from 'react';
import { 
  X, 
  Users, 
  BookOpen, 
  Bell, 
  BellOff, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Pin, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { ChatConversation } from '@/lib/conversations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ChatConversation;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onClearChat?: (option: 'chat_only' | 'media_only' | 'everything') => void;
}

export function ChatDetailsSheet({
  isOpen,
  onClose,
  conversation,
  isMuted = false,
  onToggleMute,
  onClearChat,
}: ChatDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');
  const isSubject = conversation.type === 'subject';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md h-full bg-[#070E1B] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-foreground">
            {isSubject ? 'Subject Details' : 'Contact Info'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Identity Card */}
          <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            {isSubject ? (
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-lg ring-2 ring-white/10"
                style={{
                  backgroundColor: conversation.color ? `${conversation.color}25` : 'rgba(59, 130, 246, 0.2)',
                  color: conversation.color || '#3B82F6',
                  border: `2px solid ${conversation.color ? `${conversation.color}50` : 'rgba(59, 130, 246, 0.4)'}`,
                }}
              >
                {conversation.facultyAbb ? (
                  <span className="font-mono tracking-tight">{conversation.facultyAbb}</span>
                ) : (
                  <BookOpen className="w-10 h-10" />
                )}
              </div>
            ) : (
              <UserAvatar
                name={conversation.name}
                avatarUrl={conversation.avatarUrl}
                avatarType={conversation.avatarType || 'preset'}
                avatarPresetId={conversation.avatarPresetId}
                avatarEmoji={conversation.avatarEmoji}
                size="xl"
                className="w-20 h-20 rounded-3xl ring-2 ring-white/10 shadow-lg"
              />
            )}

            <div>
              <h3 className="text-lg font-bold text-foreground">{conversation.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{conversation.subtitle}</p>
              {conversation.bio && (
                <p className="text-xs text-muted-foreground/80 mt-2 max-w-xs leading-relaxed">
                  {conversation.bio}
                </p>
              )}
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {isSubject ? (
                <>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {conversation.room || 'Room No. 03'}
                  </span>
                  {conversation.code && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 text-muted-foreground border border-white/10">
                      {conversation.code}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Cohort Authorized
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 capitalize">
                    Role: {conversation.role || 'Student'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active on StarX Study
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Details & Actions Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
              Settings & Actions
            </h4>

            {/* Notification Mute */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 text-muted-foreground">
                  {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Mute Notifications</p>
                  <p className="text-[11px] text-muted-foreground">Silence new message alerts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleMute}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  isMuted
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/10 text-foreground hover:bg-white/15'
                )}
              >
                {isMuted ? 'Muted' : 'Mute'}
              </button>
            </div>

            {/* Clear Chat for Me */}
            {onClearChat && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Clear Chat (Personal View)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Clears messages on your device without deleting shared class records.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onClearChat('chat_only')}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-foreground border border-white/10 transition-colors cursor-pointer text-center"
                  >
                    Clear Text Only
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearChat('everything')}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer text-center"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Security Note */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isSubject
                ? 'Subject messages are protected by cohort-based RLS permissions and audited under institutional guidelines.'
                : 'Personal messages are encrypted and strictly participant-authorized. StarX Study enforces zero-trust participant access.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

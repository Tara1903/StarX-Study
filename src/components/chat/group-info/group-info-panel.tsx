'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  X, 
  Search, 
  UserPlus, 
  Bell, 
  BellOff, 
  Trash2, 
  ChevronRight, 
  Edit3, 
  Check, 
  ShieldCheck, 
  Pin, 
  FileText, 
  ExternalLink, 
  Image as ImageIcon,
  Users,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ImageViewerModal } from './image-viewer-modal';
import { MediaBrowserDialog } from './media-browser-dialog';
import { MemberProfileDialog } from './member-profile-dialog';
import { AddMemberDialog } from './add-member-dialog';
import { updateGroupDetails } from '@/actions/group-info';
import { useUser } from '@/components/providers/user-provider';
import type { GroupInfoData, GroupMember, SharedMediaItem } from '@/lib/group-info-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GroupInfoPanelProps {
  data: GroupInfoData;
  onClose?: () => void;
  onTriggerSearch?: () => void;
  onToggleMute?: () => void;
  onClearChat?: (option: 'chat_only' | 'media_only' | 'everything') => void;
  isMuted?: boolean;
  className?: string;
  isMobileFullPage?: boolean;
}

export function GroupInfoPanel({
  data,
  onClose,
  onTriggerSearch,
  onToggleMute,
  onClearChat,
  isMuted = false,
  className,
  isMobileFullPage = false,
}: GroupInfoPanelProps) {
  const router = useRouter();
  const { activeRole } = useUser();
  const isTeacher = activeRole === 'teacher' || activeRole === 'institute_head';
  const isSubject = data.type === 'subject';

  // State management
  const [description, setDescription] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`studchat_group_desc_${data.id}`);
      if (saved) return saved;
    }
    return data.description;
  });
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescText, setEditDescText] = useState(description);
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  // Modals state
  const [selectedImage, setSelectedImage] = useState<SharedMediaItem | null>(null);
  const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);

  // Search state for member list
  const [memberSearch, setMemberSearch] = useState('');
  const [membersList, setMembersList] = useState<GroupMember[]>(data.members);

  // Load any previously added members from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `studchat_group_members_${data.id}`;
        const extra = JSON.parse(localStorage.getItem(key) || '[]');
        if (extra.length > 0) {
          setMembersList((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const toAdd = extra.filter((m: GroupMember) => !seen.has(m.id));
            return [...toAdd, ...prev];
          });
        }
      } catch {}
    }
  }, [data.id]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return membersList;
    const q = memberSearch.toLowerCase();
    return membersList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [membersList, memberSearch]);

  const previewMedia = useMemo(() => data.media.slice(0, 5), [data.media]);

  const handleSaveDescription = async () => {
    if (!editDescText.trim()) return;
    try {
      setIsSavingDesc(true);
      const res = await updateGroupDetails({
        conversationId: data.id,
        description: editDescText,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`studchat_group_desc_${data.id}`, editDescText);
      }
      setDescription(editDescText);
      setIsEditingDesc(false);
      toast.success('Group description updated');
    } catch {
      toast.error('Failed to update description');
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleMemberAdded = (newMember: GroupMember) => {
    setMembersList((prev) => [newMember, ...prev]);
    if (typeof window !== 'undefined') {
      try {
        const key = `studchat_group_members_${data.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([newMember, ...existing]));
      } catch {}
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[#050B16] text-foreground overflow-y-auto select-none',
        isMobileFullPage ? 'w-full pb-10' : 'w-full border-l border-white/10',
        className
      )}
    >
      {/* 1. Top Navigation Bar */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-[#050B16]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 pt-[calc(0.6rem+env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to chat"
              className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              {isMobileFullPage ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          )}
          <h2 className="text-base font-bold text-foreground">
            {isSubject ? 'Group info' : 'Chat info'}
          </h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 p-4 sm:p-5">
        {/* 2. Group Hero Section */}
        <div className="flex flex-col items-center text-center space-y-3 p-5 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
          {/* Large circular/rounded avatar */}
          <div className="relative">
            {isSubject ? (
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-3xl shadow-xl ring-2 ring-white/10"
                style={{
                  backgroundColor: data.color ? `${data.color}25` : 'rgba(59, 130, 246, 0.2)',
                  color: data.color || '#3B82F6',
                  border: `2px solid ${data.color ? `${data.color}50` : 'rgba(59, 130, 246, 0.4)'}`,
                }}
              >
                {data.facultyAbb ? (
                  <span className="font-mono tracking-tight">{data.facultyAbb}</span>
                ) : (
                  <Users className="w-10 h-10" />
                )}
              </div>
            ) : (
              <UserAvatar
                name={data.name}
                avatarUrl={data.avatarUrl}
                avatarType={data.avatarType || 'preset'}
                avatarPresetId={data.avatarPresetId}
                avatarEmoji={data.avatarEmoji}
                size="xl"
                className="w-24 h-24 rounded-3xl ring-2 ring-white/10 shadow-xl"
              />
            )}
          </div>

          {/* Group Title & Counts */}
          <div className="space-y-1 max-w-sm">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{data.name}</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {isSubject
                ? `${membersList.length} members · ${data.teacherCount} ${data.teacherCount === 1 ? 'teacher' : 'teachers'}`
                : 'Direct personal conversation • ECE Section A'}
            </p>

            {/* Room / Code tags if subject */}
            {isSubject && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {data.room && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {data.room}
                  </span>
                )}
                {data.code && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/5 text-muted-foreground border border-white/10">
                    {data.code}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3. Quick Actions Toolbar */}
          <div className="flex items-center justify-center gap-2.5 pt-2 w-full max-w-xs">
            {isSubject && isTeacher && (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="flex-1 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-foreground flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-semibold">Add</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onTriggerSearch?.();
              }}
              className="flex-1 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-foreground flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-semibold">Search</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="flex-1 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-foreground flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-primary" />}
              <span className="text-[11px] font-semibold">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>
          </div>
        </div>

        {/* 4. Group Description Section */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Description
            </h3>
            {isTeacher && isSubject && !isEditingDesc && (
              <button
                type="button"
                onClick={() => setIsEditingDesc(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {isEditingDesc ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={editDescText}
                onChange={(e) => setEditDescText(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-primary/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDesc(false);
                    setEditDescText(description);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={isSavingDesc}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className={cn('text-xs text-foreground/85 leading-relaxed', !isDescExpanded && 'line-clamp-3')}>
                {description}
              </p>
              {description.length > 140 && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-[11px] font-bold text-primary hover:underline mt-1 cursor-pointer"
                >
                  {isDescExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 5. Media, Links and Docs Section (WhatsApp Pattern) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Media, links and docs
              </h3>
              <span className="text-xs font-bold text-primary px-2 py-0.2 rounded-full bg-primary/10 border border-primary/20">
                {data.media.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMediaBrowserOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontally scrollable preview strip */}
          {previewMedia.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No media shared yet.</p>
          ) : (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
              {previewMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'image') setSelectedImage(item);
                    else setIsMediaBrowserOpen(true);
                  }}
                  className="w-18 h-18 rounded-2xl shrink-0 overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-primary/60 transition-all relative group"
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : item.type === 'document' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/10 text-red-400 p-1 text-center">
                      <FileText className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-semibold truncate w-full px-1">{item.name.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-500/10 text-primary p-1 text-center">
                      <ExternalLink className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-semibold truncate w-full px-1">LINK</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Members Section */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Members ({membersList.length})
            </h3>
            {isTeacher && isSubject && (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>Add people</span>
              </button>
            )}
          </div>

          {/* Search Members */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Member Rows */}
          <div className="space-y-1 max-h-[380px] overflow-y-auto">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <UserAvatar
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    avatarType={member.avatarType || 'preset'}
                    avatarPresetId={member.avatarPresetId}
                    avatarEmoji={member.avatarEmoji}
                    size="sm"
                    className="shrink-0 ring-1 ring-white/10"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{member.subtitle}</p>
                  </div>
                </div>

                {/* Teacher / Admin Badge */}
                <div className="shrink-0">
                  {member.role === 'teacher' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                      <ShieldCheck className="w-3 h-3" />
                      Teacher
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">Student</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Pinned Messages Section */}
        {data.pinnedMessages && data.pinnedMessages.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
              <span>Pinned Notice</span>
            </h3>
            {data.pinnedMessages.map((pin) => (
              <div key={pin.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                <p className="font-semibold text-amber-300/90 mb-1">{pin.senderName}:</p>
                <p className="text-muted-foreground leading-relaxed">“{pin.content}”</p>
              </div>
            ))}
          </div>
        )}

        {/* 8. Group Settings & Danger Zone */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
            Settings & Actions
          </h3>

          {/* Clear Chat for Me */}
          {onClearChat && (
            <button
              type="button"
              onClick={() => setIsClearChatConfirmOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs font-semibold">Clear Chat (for me)</p>
                  <p className="text-[11px] text-muted-foreground">Clears messages on your personal view</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Dialogs & Viewers (Rendered only on-demand) */}
      {selectedImage && (
        <ImageViewerModal
          item={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {isMediaBrowserOpen && (
        <MediaBrowserDialog
          isOpen={isMediaBrowserOpen}
          onClose={() => setIsMediaBrowserOpen(false)}
          media={data.media}
          groupName={data.name}
          onSelectImage={(item) => {
            setIsMediaBrowserOpen(false);
            setSelectedImage(item);
          }}
        />
      )}

      {selectedMember && (
        <MemberProfileDialog
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {isAddMemberOpen && (
        <AddMemberDialog
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          conversationId={data.id}
          currentMemberIds={membersList.map((m) => m.id)}
          onMemberAdded={handleMemberAdded}
        />
      )}

      {/* Clear Chat Selection Modal */}
      {isClearChatConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-sm bg-[#070E1B] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-foreground">Clear chat for you?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Shared classroom records and faculty posts remain intact for the class. Select an option:
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClearChat?.('chat_only');
                  setIsClearChatConfirmOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-foreground text-left transition-colors cursor-pointer"
              >
                1. Clear text messages only
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearChat?.('media_only');
                  setIsClearChatConfirmOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-foreground text-left transition-colors cursor-pointer"
              >
                2. Clear media files only
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearChat?.('everything');
                  setIsClearChatConfirmOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 text-left transition-colors cursor-pointer"
              >
                3. Clear all messages & media
              </button>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsClearChatConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

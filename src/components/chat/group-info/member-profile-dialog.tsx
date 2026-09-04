'use client';

import { X, MessageSquare, ShieldCheck, Mail, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { GroupMember } from '@/lib/group-info-data';

interface MemberProfileDialogProps {
  member: GroupMember | null;
  onClose: () => void;
  canMessage?: boolean;
}

export function MemberProfileDialog({
  member,
  onClose,
  canMessage = true,
}: MemberProfileDialogProps) {
  const router = useRouter();
  if (!member) return null;

  const isTeacher = member.role === 'teacher';

  const handleStartMessage = () => {
    onClose();
    // Normalize member id to personal chat format
    const targetSlug = member.id.startsWith('user-')
      ? `p-${member.id.replace('user-', '')}`
      : member.id.startsWith('teacher-')
      ? `p-${member.id.replace('teacher-', '')}`
      : member.id;
    router.push(`/chat/${targetSlug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm bg-[#070E1B] border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close profile"
          className="absolute right-4 top-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative pt-2">
          <UserAvatar
            name={member.name}
            avatarUrl={member.avatarUrl}
            avatarType={member.avatarType || 'preset'}
            avatarPresetId={member.avatarPresetId}
            avatarEmoji={member.avatarEmoji}
            size="xl"
            className="w-20 h-20 rounded-3xl ring-2 ring-white/10 shadow-xl"
          />
          {isTeacher && (
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-primary text-primary-foreground shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Identity Details */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
          <p className="text-xs text-muted-foreground">{member.subtitle}</p>

          {/* Role Pill */}
          <div className="pt-1 flex items-center justify-center gap-1.5">
            {isTeacher ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30">
                <ShieldCheck className="w-3 h-3" />
                Teacher • Group Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-muted-foreground border border-white/10">
                <GraduationCap className="w-3 h-3" />
                Student
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-xs text-muted-foreground/85 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-xl w-full">
            {member.bio}
          </p>
        )}

        {/* Institutional Verification */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <Mail className="w-3.5 h-3.5 text-primary/70" />
          <span className="truncate">{member.email}</span>
        </div>

        {/* Action Button: Message */}
        {canMessage && (
          <button
            type="button"
            onClick={handleStartMessage}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message {member.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatConversationList } from '@/components/chat/chat-conversation-list';
import { resolveSubject, isUuid } from '@/lib/subject-resolver';
import type { ChatConversation } from '@/lib/conversations';
import { Loader2 } from 'lucide-react';

interface ChatConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChatConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params;
  return {
    title: 'Chat | studchat',
    description: 'Realtime chat session on studchat',
  };
}

export default async function ChatConversationPage({ params }: ChatConversationPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let conv: ChatConversation | null = null;

  // 1. Check if conversationId is a Personal Conversation
  if (isUuid(conversationId)) {
    const { data: dbConv } = await supabase
      .from('conversations')
      .select('id, type, created_at')
      .eq('id', conversationId)
      .maybeSingle();

    if (dbConv && dbConv.type === 'personal') {
      // Strict Security: Verify current user is an authorized participant
      const { data: participantRecord } = await supabase
        .from('conversation_participants')
        .select('id, role')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!participantRecord) {
        notFound();
      }

      // Fetch the other participant profile
      const { data: otherRecord } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          role,
          profile:profiles!inner(
            id,
            full_name,
            avatar_url,
            avatar_type,
            avatar_preset_id,
            avatar_emoji,
            bio
          )
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .maybeSingle();

      const rawProfile = otherRecord?.profile;
      const otherProfile: any = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
      if (!otherProfile) {
        notFound();
      }

      conv = {
        id: conversationId,
        type: 'personal',
        name: otherProfile.full_name,
        subtitle: 'Direct Message',
        bio: otherProfile.bio || undefined,
        role: (otherRecord as any)?.role || 'student',
        avatarUrl: otherProfile.avatar_url,
        avatarType: (otherProfile.avatar_type as any) || 'initials',
        avatarPresetId: otherProfile.avatar_preset_id,
        avatarEmoji: otherProfile.avatar_emoji,
        lastActivityTimestamp: dbConv.created_at,
        unreadCount: 0,
        onlineStatus: 'online',
      };
    }
  }

  // 2. If not a personal conversation, check if conversationId is a Subject Room
  if (!conv) {
    const dbSub = await resolveSubject(conversationId, supabase);
    if (dbSub) {
      // Strict Security: Verify current user is an authorized member of this subject
      const { data: subjectMembership } = await supabase
        .from('subject_members')
        .select('id, role')
        .eq('subject_id', dbSub.uuid)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!subjectMembership) {
        notFound();
      }

      conv = {
        id: dbSub.id,
        type: 'subject',
        name: dbSub.name,
        subtitle: `${dbSub.facultyAbb} • ${dbSub.facultyName}`,
        color: dbSub.color,
        avatarType: 'initials',
        lastActivityTimestamp: new Date().toISOString(),
        unreadCount: 0,
        facultyName: dbSub.facultyName,
        facultyAbb: dbSub.facultyAbb,
        subjectUuid: dbSub.uuid,
        room: dbSub.room,
        code: dbSub.code,
      };
    }
  }

  if (!conv) {
    notFound();
  }

  return (
    <div className="h-full lg:h-screen flex w-full overflow-hidden bg-[#050B16]">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[360px] xl:w-[400px] h-full shrink-0 flex-col border-r border-white/10">
        <ChatConversationList currentConversationId={conv.id} />
      </div>

      {/* Active Conversation Area (Full width on Mobile, Flex-1 on Desktop) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center bg-[#050B16]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        >
          <ChatContainer
            subjectId={conv.id}
            subjectUuid={conv.subjectUuid || (conv.type === 'personal' ? conv.id : undefined)}
            subjectName={conv.name}
            subjectCode={conv.code}
            facultyName={conv.facultyName}
            facultyAbb={conv.facultyAbb}
            academicContext={conv.subtitle}
            room={conv.room}
            color={conv.color}
            conversationType={conv.type}
            backHref="/chat"
            avatarUrl={conv.avatarUrl}
            avatarType={conv.avatarType}
            avatarPresetId={conv.avatarPresetId}
            avatarEmoji={conv.avatarEmoji}
            onlineStatus={conv.onlineStatus}
            bio={conv.bio}
            role={conv.role}
          />
        </Suspense>
      </div>
    </div>
  );
}

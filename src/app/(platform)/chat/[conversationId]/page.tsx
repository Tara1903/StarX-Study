import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/chat-container';
import { resolveSubject, isUuid } from '@/lib/subject-resolver';
import type { ChatConversation } from '@/lib/conversations';
import { Loader2 } from 'lucide-react';

interface ChatConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
  searchParams?: Promise<{
    info?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChatConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params;
  return {
    title: 'Chat | StarX Study',
    description: 'Realtime chat session on StarX Study',
  };
}

export default async function ChatConversationPage({ params, searchParams }: ChatConversationPageProps) {
  const { conversationId } = await params;
  const search = searchParams ? await searchParams : undefined;
  const isInfoOpen = search?.info === '1' || search?.info === 'true';
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
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden min-w-0 bg-background">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center bg-background">
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
          defaultGroupInfoOpen={isInfoOpen}
        />
      </Suspense>
    </div>
  );
}

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatConversationList } from '@/components/chat/chat-conversation-list';
import { getConversationById } from '@/lib/conversations';
import { resolveSubject } from '@/lib/subject-resolver';
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
  const conv = getConversationById(conversationId);
  return {
    title: conv ? `${conv.name} | Chat` : 'Conversation | studchat',
    description: conv ? `Chat in ${conv.name} on studchat` : 'Chat on studchat',
  };
}

export default async function ChatConversationPage({ params }: ChatConversationPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();

  // 1. Resolve conversation metadata
  let conv = getConversationById(conversationId);

  // If not found in pre-seeded list, attempt database subject resolution
  if (!conv) {
    const dbSub = await resolveSubject(conversationId, supabase);
    if (dbSub) {
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
    <div className="h-[calc(100vh-4.25rem)] lg:h-[calc(100vh-4rem)] flex w-full overflow-hidden bg-[#050B16]">
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
            subjectUuid={conv.subjectUuid}
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

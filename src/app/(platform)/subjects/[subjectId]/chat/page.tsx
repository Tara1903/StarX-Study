import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatConversationList } from '@/components/chat/chat-conversation-list';
import { resolveSubject } from '@/lib/subject-resolver';
import { Loader2 } from 'lucide-react';

interface ChatPageProps {
  params: Promise<{
    subjectId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { subjectId } = await params;
  const supabase = await createClient();
  const subject = await resolveSubject(subjectId, supabase);
  return {
    title: subject ? `${subject.name} • Chat | studchat` : 'Subject Chat | studchat',
    description: subject ? `Chat in ${subject.name} on studchat` : 'Subject Chat on studchat',
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Resolve subject by slug or UUID
  const subject = await resolveSubject(subjectId, supabase);
  if (!subject) {
    notFound();
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('subject_members')
    .select('id')
    .eq('subject_id', subject.uuid)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  return (
    <div className="h-full lg:h-screen flex w-full overflow-hidden bg-[#050B16]">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[360px] xl:w-[400px] h-full shrink-0 flex-col border-r border-white/10">
        <ChatConversationList currentConversationId={subject.id} />
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
            subjectId={subject.id}
            subjectUuid={subject.uuid}
            subjectName={subject.name}
            subjectCode={subject.code}
            facultyName={subject.facultyName}
            facultyAbb={subject.facultyAbb}
            academicContext={subject.academicContext}
            room={subject.room}
            color={subject.color}
            conversationType="subject"
            backHref={`/subjects/${subject.id}`}
          />
        </Suspense>
      </div>
    </div>
  );
}

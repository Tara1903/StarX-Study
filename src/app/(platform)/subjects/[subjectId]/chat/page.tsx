import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/chat-container';
import { resolveSubject } from '@/lib/subject-resolver';
import { Loader2 } from 'lucide-react';

interface ChatPageProps {
  params: Promise<{
    subjectId: string;
  }>;
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

  return (
    <div className="h-[calc(100vh-4.25rem)] p-2 sm:p-4 max-w-6xl mx-auto flex flex-col">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
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
        />
      </Suspense>
    </div>
  );
}

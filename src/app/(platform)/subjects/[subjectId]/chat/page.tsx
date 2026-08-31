import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatContainer } from '@/components/chat/chat-container';
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

  const { data: subject, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', subjectId)
    .single();

  if (error || !subject) {
    notFound();
  }

  // TODO: Verify user is a member of this subject

  return (
    <div className="h-[calc(100vh-4rem)] p-4 max-w-5xl mx-auto">
      <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <ChatContainer subjectId={subject.id} subjectName={subject.name} />
      </Suspense>
    </div>
  );
}

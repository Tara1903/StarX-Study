import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveSubject } from '@/lib/subject-resolver';

interface ChatPageProps {
  params: Promise<{
    subjectId: string;
  }>;
}

export default async function SubjectChatRedirectPage({ params }: ChatPageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const subject = await resolveSubject(subjectId, supabase);
  if (!subject) {
    notFound();
  }
  redirect(`/chat/${subject.id}`);
}

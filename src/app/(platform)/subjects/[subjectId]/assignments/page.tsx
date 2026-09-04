import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';
import { resolveSubject, getSubjectAssignments, isUuid } from '@/lib/subject-resolver';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectAssignmentsPage({ params }: PageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const subject = await resolveSubject(subjectId, supabase);
  if (!subject) {
    notFound();
  }

  let assignments: any[] = [];
  if (isUuid(subject.uuid)) {
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subject.uuid)
        .order('due_date', { ascending: true });

      if (data && data.length > 0) {
        assignments = data;
      }
    } catch {}
  }

  if (assignments.length === 0) {
    assignments = getSubjectAssignments(subject.id);
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {subject.name}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="text-sm text-muted-foreground">
            {subject.name} • {subject.facultyName}
          </p>
        </div>

        <Link
          href={`/subjects/${subject.id}/chat`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Go to Chat</span>
        </Link>
      </header>

      {/* Assignments List */}
      <div className="space-y-2.5">
        {assignments.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
            No coursework assigned for this subject yet.
          </div>
        ) : (
          assignments.map((item) => (
            <Link
              key={item.id}
              href={`/subjects/${subject.id}/assignments/${item.id}`}
              className="p-4 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 group"
            >
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {item.instructions || 'Course submission assignment'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted/70 text-muted-foreground">
                  Due {new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

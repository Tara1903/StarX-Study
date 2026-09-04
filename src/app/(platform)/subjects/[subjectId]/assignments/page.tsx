import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, ChevronRight, MessageSquare, ClipboardList } from 'lucide-react';
import { resolveSubject } from '@/lib/subject-resolver';

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

  // Authorization check
  const { data: membership } = await supabase
    .from('subject_members')
    .select('id')
    .eq('subject_id', subject.uuid)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  let assignments: any[] = [];
  try {
    const { data: dbAssignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        submission:assignment_submissions(
          id,
          status,
          marks,
          submitted_at
        )
      `)
      .eq('subject_id', subject.uuid)
      .order('due_date', { ascending: true });

    if (!error && dbAssignments) {
      assignments = dbAssignments.map((a: any) => {
        const sub = Array.isArray(a.submission) && a.submission.length > 0 ? a.submission[0] : null;
        return {
          ...a,
          submissionStatus: sub?.status || 'pending',
          marks: sub?.marks,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching subject assignments:', err);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {subject.name}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 sm:border-border">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
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
          <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-2">
            <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
              <ClipboardList className="w-5 h-5" />
            </div>
            <p className="font-semibold text-foreground text-sm">No assignments posted</p>
            <p className="text-xs text-muted-foreground">No coursework assigned for {subject.name} yet.</p>
          </div>
        ) : (
          assignments.map((item) => {
            const isSubmitted = item.submissionStatus === 'submitted' || item.submissionStatus === 'graded';
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.instructions || item.description || 'Course submission assignment'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted/70 text-muted-foreground">
                    {item.due_date 
                      ? `Due ${new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      : 'No due date'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

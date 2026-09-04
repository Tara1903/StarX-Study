import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronRight, CheckCircle2, Clock, ClipboardList } from 'lucide-react';

export default async function GlobalAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch authorized subject memberships
  const { data: dbMemberships } = await supabase
    .from('subject_members')
    .select('subject_id')
    .eq('user_id', user.id);

  const userSubjectIds = (dbMemberships || []).map((m: any) => m.subject_id);

  let displayAssignments: any[] = [];

  if (userSubjectIds.length > 0) {
    try {
      const { data: dbAssignments, error } = await supabase
        .from('assignments')
        .select(`
          id,
          subject_id,
          title,
          description,
          due_date,
          max_marks,
          subject:subjects(id, name, color),
          submission:assignment_submissions(
            id,
            status,
            marks,
            submitted_at
          )
        `)
        .in('subject_id', userSubjectIds)
        .order('due_date', { ascending: true });

      if (!error && dbAssignments) {
        displayAssignments = dbAssignments.map((a: any) => {
          const sub = Array.isArray(a.submission) && a.submission.length > 0 ? a.submission[0] : null;
          let statusText = 'Pending';
          if (sub) {
            if (sub.status === 'graded') {
              statusText = sub.marks !== null ? `Graded (${sub.marks}/${a.max_marks || 100})` : 'Graded';
            } else if (sub.status === 'submitted') {
              statusText = 'Submitted';
            }
          }

          const dueDateObj = a.due_date ? new Date(a.due_date) : null;
          const isUrgent = dueDateObj ? (dueDateObj.getTime() - Date.now() < 48 * 3600 * 1000 && dueDateObj.getTime() > Date.now()) : false;

          return {
            id: a.id,
            subjectId: a.subject_id,
            subjectName: a.subject?.name || 'Subject Coursework',
            color: a.subject?.color || '#3B82F6',
            title: a.title,
            due: dueDateObj ? dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date',
            status: statusText,
            urgent: isUrgent,
          };
        });
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  }

  const pendingAssignments = displayAssignments.filter((a) => a.status === 'Pending');
  const completedAssignments = displayAssignments.filter((a) => a.status !== 'Pending');

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Assignments
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your active coursework & submissions
        </p>
      </header>

      {userSubjectIds.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-2">
          <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="font-semibold text-foreground text-sm">No Enrolled Subjects</p>
          <p className="text-xs text-muted-foreground">You are not enrolled in any subjects yet. Coursework will appear here once you are assigned to subjects.</p>
        </div>
      ) : displayAssignments.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-2">
          <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="font-semibold text-foreground text-sm">No Assignments</p>
          <p className="text-xs text-muted-foreground">There are no assignments posted for your enrolled subjects right now.</p>
        </div>
      ) : (
        <>
          {/* Due Soon Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-foreground">
                Due Soon
              </h2>
            </div>

            <div className="space-y-2.5">
              {pendingAssignments.length === 0 ? (
                <p className="p-6 rounded-xl bg-card/30 border border-border/60 text-xs text-muted-foreground">
                  No pending assignments right now. You are all caught up!
                </p>
              ) : (
                pendingAssignments.map((item) => (
                  <Link
                    key={item.id}
                    href={`/subjects/${item.subjectId}/assignments`}
                    className="p-4 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-xs text-muted-foreground block truncate">
                          {item.subjectName}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          item.urgent
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-muted/70 text-muted-foreground'
                        }`}
                      >
                        Due {item.due}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Completed Section */}
          {completedAssignments.length > 0 && (
            <section className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-foreground">
                  Submitted & Graded
                </h2>
              </div>

              <div className="space-y-2.5">
                {completedAssignments.map((item) => (
                  <Link
                    key={item.id}
                    href={`/subjects/${item.subjectId}/assignments`}
                    className="p-4 rounded-xl bg-card/60 border border-border/60 hover:border-border transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 opacity-70"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-xs text-muted-foreground block truncate">
                          {item.subjectName}
                        </span>
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                        {item.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

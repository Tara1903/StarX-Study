import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

export default async function GlobalAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Pre-seeded curriculum assignments + database assignments
  const fallbackAssignments = [
    {
      id: 'asg-1',
      subjectId: 'graphics',
      subjectName: 'Engineering Graphics',
      color: '#EC4899',
      title: 'Orthographic Projections Sheet 2',
      due: 'Tomorrow, 5:00 PM',
      status: 'Pending',
      urgent: true,
    },
    {
      id: 'asg-2',
      subjectId: 'math-1',
      subjectName: 'Mathematics-I',
      color: '#3B82F6',
      title: 'Problem Set 4 — Matrices & Rank',
      due: 'Friday',
      status: 'Pending',
      urgent: false,
    },
    {
      id: 'asg-3',
      subjectId: 'chemistry',
      subjectName: 'Chemistry',
      color: '#10B981',
      title: 'Water Technology Practical Log',
      due: 'Next Monday',
      status: 'Submitted',
      urgent: false,
    },
    {
      id: 'asg-4',
      subjectId: 'basic-electrical',
      subjectName: 'Basic Electrical',
      color: '#F59E0B',
      title: 'DC Network Theorems Analysis',
      due: 'Last Week',
      status: 'Graded (9/10)',
      urgent: false,
    }
  ];

  let displayAssignments = [...fallbackAssignments];

  try {
    const { data: dbAssignments } = await supabase
      .from('assignments')
      .select(`
        *,
        subject:subject_id(id, name, color_code)
      `)
      .order('due_date', { ascending: true })
      .limit(20);

    if (dbAssignments && dbAssignments.length > 0) {
      const mapped = dbAssignments.map((a: any) => ({
        id: a.id,
        subjectId: a.subject_id,
        subjectName: a.subject?.name || 'Subject Coursework',
        color: a.subject?.color_code || '#3B82F6',
        title: a.title,
        due: new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        status: 'Pending',
        urgent: false,
      }));
      displayAssignments = [...mapped, ...displayAssignments];
    }
  } catch {}

  const pendingAssignments = displayAssignments.filter((a) => a.status === 'Pending');
  const completedAssignments = displayAssignments.filter((a) => a.status !== 'Pending');

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header (Section 12 & 33) */}
      <header className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Assignments
        </h1>
        <p className="text-sm text-muted-foreground">
          Your active coursework & submissions
        </p>
      </header>

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
              No pending assignments.
            </p>
          ) : (
            pendingAssignments.map((item) => (
              <Link
                key={item.id}
                href={`/subjects/${item.subjectId}`}
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
              href={`/subjects/${item.subjectId}`}
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
    </div>
  );
}

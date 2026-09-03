import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function GlobalAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subject_id(id, name, color_code)
    `)
    .order('due_date', { ascending: true })
    .limit(20);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6 sm:gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Assignments</h1>
        <p className="text-muted-foreground mt-1">Manage coursework across all your subjects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Upcoming
          </h2>
          <div className="flex flex-col gap-3">
            {!assignments?.length && (
              <p className="text-sm text-muted-foreground italic">No upcoming tasks</p>
            )}
            {assignments?.map((assignment) => (
              <Link 
                key={assignment.id}
                href={`/subjects/${assignment.subject_id}/assignments/${assignment.id}`}
                className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all group border-l-4"
                style={{ borderLeftColor: assignment.subject?.color_code || '#3b82f6' }}
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {assignment.subject?.name}
                </p>
                <h4 className="font-semibold text-sm group-hover:text-primary line-clamp-2">{assignment.title}</h4>
                <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Past Due */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Past Due
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground italic">No overdue tasks</p>
          </div>
        </div>

        {/* Completed */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Completed
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground italic">Recent completed tasks appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

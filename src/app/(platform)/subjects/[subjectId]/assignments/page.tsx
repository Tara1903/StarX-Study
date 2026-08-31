import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

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

  const { data: membership } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const isTeacher = membership.role === 'teacher';

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('subject_id', subjectId)
    .order('due_date', { ascending: true });

  const getStatusInfo = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { color: 'text-red-600 bg-red-100 border-red-200', text: 'Overdue', icon: AlertCircle };
    if (diffDays <= 2) return { color: 'text-amber-600 bg-amber-100 border-amber-200', text: 'Due Soon', icon: Clock };
    return { color: 'text-emerald-600 bg-emerald-100 border-emerald-200', text: 'Upcoming', icon: Calendar };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and manage coursework.</p>
        </div>
        {isTeacher && (
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create Assignment
          </button>
        )}
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50 border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No active assignments</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            There are no assignments posted for this subject at the moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {assignments.map((assignment) => {
            const status = getStatusInfo(assignment.due_date);
            const StatusIcon = status.icon;

            return (
              <Link 
                key={assignment.id} 
                href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{assignment.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(assignment.due_date).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {assignment.max_marks && (
                      <span>Max Marks: {assignment.max_marks}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.text}
                  </span>
                  {isTeacher && (
                    <span className="text-xs text-muted-foreground font-medium">
                      0 Submissions
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

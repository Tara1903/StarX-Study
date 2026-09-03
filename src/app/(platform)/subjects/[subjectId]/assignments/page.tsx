import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  BarChart3,
  Bell,
  FileText,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
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

  // Fetch assignments from DB or pre-seeded subject assignments
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
    } catch {
      // ignore
    }
  }

  if (assignments.length === 0) {
    assignments = getSubjectAssignments(subject.id);
  }

  const getStatusInfo = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { color: 'text-red-400 bg-red-500/10 border-red-500/20', text: 'Overdue', icon: AlertCircle };
    if (diffDays <= 3) return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', text: 'Due Soon', icon: Clock };
    return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', text: 'Upcoming', icon: Calendar };
  };

  const tabs = [
    { name: 'Overview', href: `/subjects/${subjectId}`, active: false, icon: BarChart3 },
    { name: 'Announcements', href: `/subjects/${subjectId}/announcements`, active: false, icon: Bell },
    { name: 'Materials', href: `/subjects/${subjectId}/materials`, active: false, icon: FileText },
    { name: 'Assignments', href: `/subjects/${subjectId}/assignments`, active: true, icon: BookOpen },
    { name: 'Chat', href: `/subjects/${subjectId}/chat`, active: false, icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-12">
      {/* Subject Header Banner */}
      <div 
        className="h-44 relative overflow-hidden flex flex-col justify-end px-6 lg:px-12 py-6 text-white shadow-md"
        style={{ 
          background: `linear-gradient(135deg, ${subject.color}, #0F172A)` 
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col gap-2 max-w-4xl">
          <Link 
            href={`/subjects/${subjectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors w-fit bg-black/25 px-2.5 py-1 rounded-md mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {subject.name}
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/90">
            <span>{subject.name}</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            <span className="bg-white/20 px-2 py-0.5 rounded font-mono">{subject.code}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">{subject.facultyName}</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Coursework & Assignments</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-background sticky top-0 z-20 px-6 lg:px-12">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                tab.active 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Active Assignments</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Continuous evaluation, lab tasks, and tutorial submissions for {subject.name}.
            </p>
          </div>
          <Link
            href={`/subjects/${subjectId}/chat`}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Discuss in Chat
          </Link>
        </div>

        <div className="space-y-4">
          {assignments.map((assignment) => {
            const statusInfo = getStatusInfo(assignment.dueDate || assignment.due_date);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={assignment.id}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-base text-foreground">
                      {assignment.title}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.text}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(assignment.dueDate || assignment.due_date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {assignment.points ? ` • ${assignment.points} Points Maximum` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Submit Work
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

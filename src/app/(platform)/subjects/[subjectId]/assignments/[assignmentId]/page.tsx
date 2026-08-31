import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, UploadCloud, CheckCircle2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ subjectId: string; assignmentId: string }>;
}

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { subjectId, assignmentId } = await params;
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

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('subject_id', subjectId)
    .single();

  if (!assignment) {
    notFound();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
      <Link 
        href={`/subjects/${subjectId}/assignments`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assignments
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight mb-4">{assignment.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Due: {new Date(assignment.due_date).toLocaleString()}
              </span>
              {assignment.max_marks && (
                <span className="bg-muted px-2.5 py-1 rounded-md text-foreground font-medium">
                  {assignment.max_marks} Points
                </span>
              )}
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">Instructions</h3>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {assignment.description || 'No specific instructions provided.'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!isTeacher ? (
            <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-semibold text-lg border-b pb-3">Your Work</h3>
              
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg bg-muted/30">
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Upload your submission</p>
                <p className="text-xs text-muted-foreground mb-4">PDF, DOCX, JPG or PNG up to 10MB</p>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
                  Choose File
                </button>
              </div>

              <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm mt-2">
                Turn In
              </button>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-semibold text-lg border-b pb-3">Submissions</h3>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="block text-2xl font-bold text-primary">0</span>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Turned In</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="block text-2xl font-bold text-foreground">12</span>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Assigned</span>
                </div>
              </div>

              <button className="w-full mt-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors border shadow-sm">
                View All Submissions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { 
  Bell, 
  BookOpen, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Users,
  ChevronRight,
  BarChart3
} from 'lucide-react';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectOverviewPage({ params }: PageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify membership and fetch subject
  const { data: membership } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select(`
      *,
      semesters (
        name,
        departments (
          name,
          institutes (name)
        )
      )
    `)
    .eq('id', subjectId)
    .single();

  if (!subject) {
    notFound();
  }

  const isTeacher = membership.role === 'teacher';

  const tabs = [
    { name: 'Overview', href: `/subjects/${subjectId}`, active: true, icon: BarChart3 },
    { name: 'Announcements', href: `/subjects/${subjectId}/announcements`, active: false, icon: Bell },
    { name: 'Materials', href: `/subjects/${subjectId}/materials`, active: false, icon: FileText },
    { name: 'Assignments', href: `/subjects/${subjectId}/assignments`, active: false, icon: BookOpen },
    { name: 'Chat', href: `/subjects/${subjectId}/chat`, active: false, icon: MessageSquare },
  ];

  if (isTeacher) {
    tabs.push({ name: 'Members', href: `/subjects/${subjectId}/members`, active: false, icon: Users });
  }

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Subject Header */}
      <div 
        className="h-48 relative overflow-hidden flex flex-col justify-end px-6 lg:px-12 py-8 text-white"
        style={{ backgroundColor: subject.color_code || '#3b82f6' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <span>{subject.semesters?.departments?.institutes?.name}</span>
            <ChevronRight className="h-4 w-4" />
            <span>{subject.semesters?.departments?.name}</span>
            <ChevronRight className="h-4 w-4" />
            <span>{subject.semesters?.name}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{subject.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-background sticky top-0 z-20 px-6 lg:px-12">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                tab.active 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:px-12 mt-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Announcements Preview */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Recent Announcements
              </h2>
              <Link 
                href={`/subjects/${subjectId}/announcements`}
                className="text-sm text-primary hover:underline font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground italic">No recent announcements</div>
            </div>
          </section>

          {/* Materials Preview */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Materials
              </h2>
              <Link 
                href={`/subjects/${subjectId}/materials`}
                className="text-sm text-primary hover:underline font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground italic">No materials uploaded yet</div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Upcoming Assignments */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming
              </h2>
              <Link 
                href={`/subjects/${subjectId}/assignments`}
                className="text-sm text-primary hover:underline font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground italic">No upcoming assignments</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

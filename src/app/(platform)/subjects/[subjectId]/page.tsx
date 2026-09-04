import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageSquare, 
  Megaphone, 
  FileText, 
  ClipboardList, 
  ChevronRight,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { ECE_SUBJECTS } from '@/lib/ece-data';
import { resolveSubject, getSubjectMaterials } from '@/lib/subject-resolver';

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

  const subject = await resolveSubject(subjectId, supabase);
  if (!subject) {
    notFound();
  }

  const materials = getSubjectMaterials(subject.id).slice(0, 3);

  const tabs = [
    { name: 'Chat', href: `/subjects/${subjectId}/chat`, icon: MessageSquare, primary: true },
    { name: 'Announcements', href: `/subjects/${subjectId}/announcements`, icon: Megaphone, primary: false },
    { name: 'Materials', href: `/subjects/${subjectId}/materials`, icon: FileText, primary: false },
    { name: 'Assignments', href: `/subjects/${subjectId}/assignments`, icon: ClipboardList, primary: false },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Subjects</span>
        </Link>
      </div>

      {/* Clean Subject Header (Section 18 & 19) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-white/10 sm:border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: subject.color || '#3B82F6' }}
            />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
              {subject.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {subject.facultyName} <span className="mx-1.5 opacity-40">•</span> I Sem • B.Tech ECE
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/subjects/${subjectId}/chat`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Subject Chat</span>
          </Link>
        </div>
      </header>

      {/* Horizontal Navigation Tabs (Section 20 & 43) */}
      <nav className="flex items-center gap-1.5 sm:gap-2 border-b border-white/10 sm:border-border pb-px overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap active:scale-95 transition-colors shrink-0 ${
              tab.primary 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </Link>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity & Materials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Chat Banner */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">Subject Discussion</h2>
              <p className="text-xs text-muted-foreground">
                Join {subject.facultyName} and classmates in the real-time discussion room.
              </p>
            </div>
            <Link
              href={`/subjects/${subjectId}/chat`}
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              Enter Room
            </Link>
          </div>

          {/* Recent Materials */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Materials</h2>
              <Link
                href={`/subjects/${subjectId}/materials`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-foreground block truncate">{mat.title}</span>
                      <span className="text-[11px] text-muted-foreground">{mat.category.toUpperCase()} • {mat.size}</span>
                    </div>
                  </div>
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium text-xs shrink-0"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col: Progressive Disclosure (Subject Info) */}
        <div className="space-y-6">
          <section className="p-5 rounded-2xl bg-card border border-border/80 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>Subject Info</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Instructor</span>
                <span className="font-medium text-foreground">{subject.facultyName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Room</span>
                <span className="font-medium text-foreground">{subject.room || 'Room No. 03'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Credits</span>
                <span className="font-medium text-foreground">4 Credit Hours</span>
              </div>
              {subject.description && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-muted-foreground block text-[11px] mb-1">Description</span>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    {subject.description}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

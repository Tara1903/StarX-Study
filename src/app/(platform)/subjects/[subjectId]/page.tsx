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
  Clock
} from 'lucide-react';
import { resolveSubject } from '@/lib/subject-resolver';

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

  // Authorization check: Verify user is a member of this subject OR institute head
  const { data: membership } = await supabase
    .from('subject_members')
    .select('id, role')
    .eq('subject_id', subject.uuid)
    .eq('user_id', user.id)
    .maybeSingle();

  let isInstituteHead = false;
  if (!membership) {
    if (subject.universityId) {
      const { data: uniMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.universityId)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();

      if (uniMember) {
        isInstituteHead = true;
      }
    }
    if (!isInstituteHead) {
      notFound();
    }
  }

  const isTeacher = membership?.role === 'teacher' || isInstituteHead;

  // Fetch real enrolled student count and real materials in parallel
  const [{ count: studentCount }, { data: dbMaterials }] = await Promise.all([
    supabase
      .from('subject_members')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subject.uuid)
      .eq('role', 'student'),
    supabase
      .from('materials')
      .select('id, title, file_name, file_type, file_size, storage_path, created_at')
      .eq('subject_id', subject.uuid)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const materials = (dbMaterials || []).map((m: any) => ({
    id: m.id,
    title: m.title,
    category: m.file_type.split('/')[1] || 'document',
    size: `${(m.file_size / (1024 * 1024)).toFixed(1)} MB`,
    file_url: m.storage_path || '#',
  }));

  const tabs = [
    { name: 'Chat', href: `/chat/${subject.id}`, icon: MessageSquare, primary: true },
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

      {/* Clean Subject Header */}
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
            {isTeacher && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                Instructor
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {subject.facultyName} <span className="mx-1.5 opacity-40">•</span> {subject.academicContext} <span className="mx-1.5 opacity-40">•</span> {studentCount ?? 0} students enrolled
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/chat/${subject.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Subject Chat</span>
          </Link>
        </div>
      </header>

      {/* Horizontal Navigation Tabs */}
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

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Coursework Materials */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Recent Materials</span>
              </h2>
              <Link
                href={`/subjects/${subjectId}/materials`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {materials.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-card border border-border/80 rounded-xl">
                No learning materials shared yet for this subject.
              </div>
            ) : (
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
                    {mat.file_url !== '#' && (
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium text-xs shrink-0"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Col: Subject Info */}
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
                <span className="text-muted-foreground block text-[11px]">Department</span>
                <span className="font-medium text-foreground">{subject.departmentName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Room</span>
                <span className="font-medium text-foreground">{subject.room || 'Room No. 03'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Credits</span>
                <span className="font-medium text-foreground">{subject.credits} Credit Hours</span>
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

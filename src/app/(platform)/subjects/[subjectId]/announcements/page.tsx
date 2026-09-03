import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  Pin,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  FileText,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { resolveSubject, getSubjectAnnouncements, isUuid } from '@/lib/subject-resolver';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectAnnouncementsPage({ params }: PageProps) {
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

  // Fetch announcements from DB or pre-seeded subject announcements
  let announcements: any[] = [];
  if (isUuid(subject.uuid)) {
    try {
      const { data } = await supabase
        .from('announcements')
        .select(`
          *,
          author:author_id(id, full_name, avatar_url)
        `)
        .eq('target_type', 'subject')
        .eq('target_id', subject.uuid)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        announcements = data;
      }
    } catch {
      // ignore query error
    }
  }

  if (announcements.length === 0) {
    announcements = getSubjectAnnouncements(subject.id);
  }

  const tabs = [
    { name: 'Overview', href: `/subjects/${subjectId}`, active: false, icon: BarChart3 },
    { name: 'Announcements', href: `/subjects/${subjectId}/announcements`, active: true, icon: Bell },
    { name: 'Materials', href: `/subjects/${subjectId}/materials`, active: false, icon: FileText },
    { name: 'Assignments', href: `/subjects/${subjectId}/assignments`, active: false, icon: BookOpen },
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

          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Subject Announcements</h1>
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
            <h2 className="text-xl font-bold tracking-tight">Updates & Class Notices</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Announcements specifically published for {subject.name} by {subject.facultyName}.
            </p>
          </div>
          <Link
            href={`/subjects/${subjectId}/chat`}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Open {subject.shortName} Chat
          </Link>
        </div>

        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.isPinned
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <h3 className="font-bold text-base text-foreground">{item.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(item.date || item.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Posted by: <span className="text-foreground font-medium">{item.author?.full_name || item.author}</span>
              </p>

              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

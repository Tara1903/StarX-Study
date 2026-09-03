import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { 
  FileText, 
  Download, 
  FileIcon, 
  ImageIcon, 
  FileAudioIcon,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  Bell,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { resolveSubject, getSubjectMaterials, isUuid } from '@/lib/subject-resolver';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectMaterialsPage({ params }: PageProps) {
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

  // Fetch materials from DB or pre-seeded subject materials
  let materials: any[] = [];
  if (isUuid(subject.uuid)) {
    try {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('subject_id', subject.uuid)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        materials = data;
      }
    } catch {
      // ignore
    }
  }

  if (materials.length === 0) {
    materials = getSubjectMaterials(subject.id);
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-9 w-9 text-blue-400" />;
    if (type.includes('audio') || type.includes('video')) return <FileAudioIcon className="h-9 w-9 text-purple-400" />;
    if (type.includes('pdf')) return <FileText className="h-9 w-9 text-red-400" />;
    return <FileIcon className="h-9 w-9 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const tabs = [
    { name: 'Overview', href: `/subjects/${subjectId}`, active: false, icon: BarChart3 },
    { name: 'Announcements', href: `/subjects/${subjectId}/announcements`, active: false, icon: Bell },
    { name: 'Materials', href: `/subjects/${subjectId}/materials`, active: true, icon: FileText },
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

          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Study Materials & Notes</h1>
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
            <h2 className="text-xl font-bold tracking-tight">Handouts & Learning Resources</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Lecture slides, question banks, and reference materials for {subject.name}.
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((file) => (
            <div
              key={file.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-primary/50 transition-all shadow-sm group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-muted/60 shrink-0">
                  {getFileIcon(file.type || file.mime_type || '')}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {file.title || file.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatSize(file.size || file.file_size)} • {file.date || new Date(file.created_at || Date.now()).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    By {file.author || subject.facultyName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

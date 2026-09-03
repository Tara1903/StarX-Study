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
  BarChart3,
  CalendarDays,
  User,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { ECE_SUBJECTS, ECE_WEEKLY_SCHEDULE } from '@/lib/ece-data';

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

  // 1. Check if this is an ECE core subject
  const eceSubject = ECE_SUBJECTS.find(s => s.id === subjectId);

  // 2. Query Supabase for custom/enrolled subject
  const { data: dbSubject } = await supabase
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
    .maybeSingle();

  if (!eceSubject && !dbSubject) {
    notFound();
  }

  // Unified Subject details
  const subjectName = eceSubject?.name || dbSubject?.name || 'Subject';
  const subjectCode = eceSubject?.code || 'IET-ECE-2026';
  const subjectColor = eceSubject?.color || dbSubject?.color || '#3B82F6';
  const facultyName = eceSubject?.facultyName || 'Department Faculty';
  const facultyAbb = eceSubject?.facultyAbb || 'ECE';
  const roomName = eceSubject?.room || 'Room No. 03';
  const description = eceSubject?.description || dbSubject?.description || 'Course curriculum and learning resources.';
  const departmentName = 'Electronics & Communication Engineering';
  const semesterName = 'I Sem (B.Tech)';
  const instituteName = 'IET, SAGE University';

  // Find classes scheduled for this subject in the timetable
  const scheduledClasses: { day: string; slot: number; time: string; type: string }[] = [];
  if (eceSubject) {
    ECE_WEEKLY_SCHEDULE.forEach(daySchedule => {
      daySchedule.periods.forEach(p => {
        if (
          p.shortName === eceSubject.shortName || 
          p.subjectName.toLowerCase().includes(eceSubject.name.toLowerCase()) ||
          (p.shortName.startsWith(eceSubject.shortName) && p.shortName.includes('Lab'))
        ) {
          scheduledClasses.push({
            day: daySchedule.day,
            slot: p.slot,
            time: p.slot === 1 ? '08:30 - 09:20' : 
                  p.slot === 2 ? '09:20 - 10:10' :
                  p.slot === 3 ? '10:10 - 11:00' :
                  p.slot === 4 ? '11:00 - 11:50' :
                  p.slot === 6 ? '12:20 - 13:10' :
                  p.slot === 7 ? '13:10 - 14:00' :
                  p.slot === 8 ? '14:00 - 14:50' : 'Scheduled',
            type: p.type || 'Lecture',
          });
        }
      });
    }
  );
  }

  const tabs = [
    { name: 'Overview', href: `/subjects/${subjectId}`, active: true, icon: BarChart3 },
    { name: 'Announcements', href: `/subjects/${subjectId}/announcements`, active: false, icon: Bell },
    { name: 'Materials', href: `/subjects/${subjectId}/materials`, active: false, icon: FileText },
    { name: 'Assignments', href: `/subjects/${subjectId}/assignments`, active: false, icon: BookOpen },
    { name: 'Chat', href: `/subjects/${subjectId}/chat`, active: false, icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-12">
      {/* Subject Header Banner */}
      <div 
        className="h-56 relative overflow-hidden flex flex-col justify-end px-6 lg:px-12 py-8 text-white shadow-md"
        style={{ 
          background: `linear-gradient(135deg, ${subjectColor}, #0F172A)` 
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col gap-3 max-w-4xl">
          <Link 
            href="/subjects" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors w-fit bg-black/25 px-2.5 py-1 rounded-md mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Subjects
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/90">
            <span>{instituteName}</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            <span>{departmentName}</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            <span className="bg-white/20 px-2 py-0.5 rounded">{semesterName}</span>
            <span className="bg-white/20 font-mono px-2 py-0.5 rounded">{subjectCode}</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{subjectName}</h1>
          <p className="text-xs lg:text-sm text-white/80 line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-background sticky top-0 z-20 px-6 lg:px-12">
        <div className="flex overflow-x-auto scrollbar-none">
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:px-12 mt-6 max-w-7xl">
        {/* Left 2 Cols: Announcements & Learning Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Course Info Card */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Course Description & Objectives
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground block">Assigned Faculty</span>
                <span className="font-semibold text-sm text-foreground mt-0.5 block">{facultyName}</span>
                <span className="text-xs text-primary font-mono">{facultyAbb}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground block">Lecture Hall / Lab</span>
                <span className="font-semibold text-sm text-foreground mt-0.5 block">{roomName}</span>
                <span className="text-xs text-muted-foreground">Main IET Block</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground block">Credit Structure</span>
                <span className="font-semibold text-sm text-foreground mt-0.5 block">{eceSubject?.credits || 4} Credit Hours</span>
                <span className="text-xs text-emerald-500 font-medium">B.Tech Syllabus</span>
              </div>
            </div>
          </section>

          {/* Announcements Preview */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Recent Announcements
              </h2>
              <Link 
                href={`/subjects/${subjectId}/announcements`}
                className="text-xs text-primary hover:underline font-semibold"
              >
                View all
              </Link>
            </div>
            <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border text-center text-sm text-muted-foreground">
              Welcome to {subjectName}! Class lecture notes and updates from {facultyName} will be posted here.
            </div>
          </section>

          {/* Materials Preview */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Course Materials & Syllabus
              </h2>
              <Link 
                href={`/subjects/${subjectId}/materials`}
                className="text-xs text-primary hover:underline font-semibold"
              >
                View all
              </Link>
            </div>
            <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border text-center text-sm text-muted-foreground">
              Module 1 syllabus and reference textbooks will be uploaded by the department.
            </div>
          </section>
        </div>

        {/* Right Col: Timetable schedule for this subject */}
        <div className="space-y-6">
          {/* Weekly Class Slots */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Class Timetable Slots
              </h3>
              <Link 
                href="/timetable"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Full Timetable
              </Link>
            </div>

            {scheduledClasses.length > 0 ? (
              <div className="space-y-2.5">
                {scheduledClasses.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">{item.day}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-primary" />
                        {item.time}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Check the master timetable for scheduled lecture timings.
              </p>
            )}

            <Link
              href="/timetable"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all"
            >
              Open Complete Timetable
              <ChevronRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Teacher Info */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Faculty In-Charge
            </h3>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {facultyAbb}
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{facultyName}</h4>
                <p className="text-xs text-muted-foreground">{departmentName}</p>
                <p className="text-xs text-[#12CFEA] font-medium">{instituteName}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

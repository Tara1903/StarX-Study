import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { 
  BookOpen, 
  Search, 
  Users, 
  CalendarDays, 
  GraduationCap, 
  MapPin, 
  User, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { ECE_SUBJECTS } from '@/lib/ece-data';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch subjects from database if any are enrolled
  const { data: dbSubjects } = await supabase
    .from('subject_members')
    .select(`
      subject_id,
      subjects:subject_id (
        id,
        name,
        color,
        description,
        semesters (
          name,
          departments (
            name,
            institutes (
              name
            )
          )
        )
      )
    `)
    .eq('user_id', user.id);

  const mappedDbSubjects = dbSubjects?.map((sm: any) => sm.subjects).filter(Boolean) || [];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ECE Department • Semester I</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Subjects</h1>
          <p className="text-muted-foreground text-sm">
            Electronics and Communication Engineering (ECE) Course Curriculum — SAGE University, Indore
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/timetable"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-[#12CFEA] text-sm font-semibold transition-all shadow-sm w-full md:w-auto"
          >
            <CalendarDays className="h-4 w-4" />
            <span>View ECE Timetable</span>
          </Link>
        </div>
      </div>

      {/* If user has database registered subjects, show them */}
      {mappedDbSubjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Registered University Subjects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mappedDbSubjects.map((subject: any) => (
              <Link key={subject.id} href={`/subjects/${subject.id}`}>
                <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5 h-full">
                  <div
                    className="h-24 w-full relative p-4 flex items-end justify-between"
                    style={{ backgroundColor: subject.color || '#3b82f6' }}
                  >
                    <span className="text-xs font-bold text-white bg-black/30 backdrop-blur px-2.5 py-1 rounded-md">
                      Enrolled
                    </span>
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subject.semesters?.departments?.name} - {subject.semesters?.name}
                    </p>
                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Open Course Space</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Primary ECE Semester 1 Subjects Curriculum */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              ECE Branch Curriculum (Semester I)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              6 Core & Foundation Engineering Subjects for July-Dec 2026 Session
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground w-fit">
            6 Subjects Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ECE_SUBJECTS.map((sub) => (
            <Link key={sub.id} href={`/subjects/${sub.id}`}>
              <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 h-full">
                {/* Banner */}
                <div
                  className="h-28 w-full relative p-4 flex flex-col justify-between"
                  style={{ 
                    background: `linear-gradient(135deg, ${sub.color}, ${sub.color}CC)` 
                  }}
                >
                  <div className="flex items-center justify-between text-white">
                    <span className="text-xs font-mono font-bold bg-black/30 backdrop-blur px-2.5 py-1 rounded-md">
                      {sub.code}
                    </span>
                    <span className="text-xs font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded">
                      {sub.credits} Credits
                    </span>
                  </div>

                  <span className="text-xs font-bold text-white/90">
                    {sub.shortName} • {sub.type.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-5 space-y-3">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{sub.facultyName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {sub.facultyAbb}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{sub.room}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Enter Subject Space</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

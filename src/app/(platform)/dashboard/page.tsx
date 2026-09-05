'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/providers/user-provider';
import { createClient } from '@/lib/supabase/client';
import { 
  BookOpen, 
  MessageSquare, 
  ClipboardList, 
  Megaphone, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Users,
  Shield,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  FileText,
  UserCheck
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface SubjectCard {
  id: string;
  name: string;
  facultyName: string;
  color: string;
  code: string;
  academicContext: string;
  studentCount?: number;
}

interface TaskItem {
  id: string;
  subjectId?: string;
  subject: string;
  title: string;
  due: string;
  status: string;
  urgent: boolean;
  url: string;
  studentName?: string;
  marks?: number | null;
}

interface UpdateItem {
  id: string;
  source: string;
  title: string;
  time: string;
  url: string;
}

export default function DashboardPage() {
  const { profile, activeRole, activeUniversity } = useUser();
  const [greeting, setGreeting] = useState('Welcome');
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  // Student & Teacher data
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);

  // Institute Head real data
  const [instStats, setInstStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    pendingReports: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const firstName = useMemo(() => {
    const name = profile?.full_name || profile?.display_name || 'there';
    return name.split(' ')[0];
  }, [profile]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile?.id) return;
      try {
        setLoading(true);

        // ==========================================
        // 1. TEACHER EXPERIENCE DATA
        // ==========================================
        if (activeRole === 'teacher') {
          // Query subjects assigned to this teacher
          const { data: teacherMemberships } = await supabase
            .from('subject_members')
            .select(`
              subject_id,
              subject:subjects!inner(
                id,
                name,
                color,
                icon,
                description,
                semester:semesters(
                  name,
                  department:departments(name, code)
                )
              )
            `)
            .eq('user_id', profile.id)
            .eq('role', 'teacher');

          const teacherSubjectIds = (teacherMemberships || []).map((m: any) => m.subject.id);

          let mappedSubjects: SubjectCard[] = [];
          if (teacherMemberships && teacherMemberships.length > 0) {
            // Get student counts for each subject
            const countPromises = teacherSubjectIds.map(async (sid: string) => {
              const { count } = await supabase
                .from('subject_members')
                .select('id', { count: 'exact', head: true })
                .eq('subject_id', sid)
                .eq('role', 'student');
              return { sid, count: count || 0 };
            });

            const counts = await Promise.all(countPromises);
            const countMap = new Map(counts.map(c => [c.sid, c.count]));

            mappedSubjects = teacherMemberships.map((m: any) => {
              const s = m.subject;
              const deptCode = s.semester?.department?.code || 'SUB';
              const semName = s.semester?.name || 'Term';
              return {
                id: s.id,
                name: s.name,
                facultyName: profile.full_name,
                color: s.color || '#3B82F6',
                code: deptCode,
                academicContext: semName,
                studentCount: countMap.get(s.id) || 0,
              };
            });
          }
          setSubjects(mappedSubjects);

          // Query pending submissions for teacher's subjects
          if (teacherSubjectIds.length > 0) {
            const { data: dbSubmissions } = await supabase
              .from('assignment_submissions')
              .select(`
                id,
                status,
                marks,
                submitted_at,
                student:profiles!student_id(full_name),
                assignment:assignments!inner(
                  id,
                  title,
                  subject_id,
                  subject:subjects(name)
                )
              `)
              .in('assignment.subject_id', teacherSubjectIds)
              .eq('status', 'submitted')
              .order('submitted_at', { ascending: false })
              .limit(5);

            if (dbSubmissions) {
              const mappedSubmissions: TaskItem[] = dbSubmissions.map((sub: any) => ({
                id: sub.id,
                subjectId: sub.assignment?.subject_id,
                subject: sub.assignment?.subject?.name || 'Subject',
                title: sub.assignment?.title || 'Assignment',
                due: sub.submitted_at ? formatRelativeTime(new Date(sub.submitted_at)) : 'Recently',
                status: 'Needs Review',
                urgent: true,
                url: `/subjects/${sub.assignment?.subject_id}/assignments`,
                studentName: sub.student?.full_name || 'Student',
              }));
              setTasks(mappedSubmissions);
            }

            // Query announcements for teacher's subjects
            const { data: dbAnnouncements } = await supabase
              .from('announcements')
              .select(`
                id,
                title,
                created_at,
                author:profiles!author_id(full_name)
              `)
              .or(`target_type.eq.university,and(target_type.eq.subject,target_id.in.(${teacherSubjectIds.join(',')}))`)
              .order('created_at', { ascending: false })
              .limit(5);

            if (dbAnnouncements) {
              setUpdates(dbAnnouncements.map((a: any) => ({
                id: a.id,
                source: a.author?.full_name || 'Academic Notice',
                title: a.title,
                time: formatRelativeTime(new Date(a.created_at)),
                url: '/announcements',
              })));
            }
          }
        } 
        // ==========================================
        // 2. INSTITUTE HEAD EXPERIENCE DATA
        // ==========================================
        else if (activeRole === 'institute_head') {
          const uniId = activeUniversity?.id;

          if (uniId) {
            // Real counts from database
            const [
              { count: studentCount },
              { count: teacherCount },
              { count: subjectCount },
              { count: reportCount },
            ] = await Promise.all([
              supabase
                .from('university_memberships')
                .select('id', { count: 'exact', head: true })
                .eq('university_id', uniId)
                .eq('role', 'student'),
              supabase
                .from('university_memberships')
                .select('id', { count: 'exact', head: true })
                .eq('university_id', uniId)
                .eq('role', 'teacher'),
              supabase
                .from('subjects')
                .select('id', { count: 'exact', head: true })
                .eq('university_id', uniId),
              supabase
                .from('reports')
                .select('id', { count: 'exact', head: true })
                .eq('university_id', uniId)
                .eq('status', 'pending'),
            ]);

            setInstStats({
              totalStudents: studentCount || 0,
              totalTeachers: teacherCount || 0,
              totalSubjects: subjectCount || 0,
              pendingReports: reportCount || 0,
            });

            // Fetch institution subjects overview
            const { data: uniSubjects } = await supabase
              .from('subjects')
              .select(`
                id,
                name,
                color,
                semester:semesters(
                  name,
                  department:departments(name, code)
                ),
                teachers:subject_members(
                  role,
                  profile:profiles(id, full_name)
                )
              `)
              .eq('university_id', uniId)
              .order('name', { ascending: true })
              .limit(6);

            if (uniSubjects) {
              const mapped = uniSubjects.map((s: any) => {
                const teacherMember = Array.isArray(s.teachers)
                  ? s.teachers.find((t: any) => t.role === 'teacher')
                  : null;
                const facultyName = teacherMember?.profile?.full_name || 'Unassigned';
                const deptCode = s.semester?.department?.code || 'SUB';
                const semName = s.semester?.name || 'Term';

                return {
                  id: s.id,
                  name: s.name,
                  facultyName,
                  color: s.color || '#3B82F6',
                  code: deptCode,
                  academicContext: semName,
                };
              });
              setSubjects(mapped);
            }

            // Fetch pending moderation reports
            const { data: dbReports } = await supabase
              .from('reports')
              .select(`
                id,
                category,
                description,
                status,
                created_at,
                reporter:profiles!reporter_id(full_name)
              `)
              .eq('university_id', uniId)
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .limit(4);

            if (dbReports) {
              setRecentReports(dbReports);
            }

            // Fetch recent announcements
            const { data: dbAnnouncements } = await supabase
              .from('announcements')
              .select(`
                id,
                title,
                created_at,
                author:profiles!author_id(full_name)
              `)
              .eq('university_id', uniId)
              .order('created_at', { ascending: false })
              .limit(4);

            if (dbAnnouncements) {
              setUpdates(dbAnnouncements.map((a: any) => ({
                id: a.id,
                source: a.author?.full_name || 'Institutional Notice',
                title: a.title,
                time: formatRelativeTime(new Date(a.created_at)),
                url: '/announcements',
              })));
            }
          }
        } 
        // ==========================================
        // 3. STUDENT EXPERIENCE DATA
        // ==========================================
        else {
          const { data: dbMemberships, error: memberError } = await supabase
            .from('subject_members')
            .select(`
              subject_id,
              subject:subjects!inner(
                id,
                name,
                color,
                icon,
                semester:semesters(
                  name,
                  department:departments(name, code)
                ),
                teachers:subject_members(
                  role,
                  profile:profiles(id, full_name)
                )
              )
            `)
            .eq('user_id', profile.id);

          if (!memberError && dbMemberships) {
            const mappedSubjects = dbMemberships.map((m: any) => {
              const s = m.subject;
              const teacherMember = Array.isArray(s.teachers)
                ? s.teachers.find((t: any) => t.role === 'teacher')
                : null;
              const facultyName = teacherMember?.profile?.full_name || 'Assigned Faculty';
              const deptCode = s.semester?.department?.code || 'SUB';
              const semName = s.semester?.name || 'Current Term';

              return {
                id: s.id,
                name: s.name,
                facultyName,
                color: s.color || '#3B82F6',
                code: deptCode,
                academicContext: semName,
              };
            });

            setSubjects(mappedSubjects);
            const subjectIds = dbMemberships.map((m: any) => m.subject.id);

            if (subjectIds.length > 0) {
              const { data: dbAssignments } = await supabase
                .from('assignments')
                .select(`
                  id,
                  subject_id,
                  title,
                  due_date,
                  subject:subjects(name),
                  submission:assignment_submissions(status)
                `)
                .in('subject_id', subjectIds)
                .order('due_date', { ascending: true })
                .limit(5);

              if (dbAssignments) {
                const mappedTasks = dbAssignments.map((a: any) => {
                  const sub = Array.isArray(a.submission) && a.submission.length > 0 ? a.submission[0] : null;
                  const dueDateObj = a.due_date ? new Date(a.due_date) : null;
                  const isUrgent = dueDateObj
                    ? dueDateObj.getTime() - Date.now() < 48 * 3600 * 1000 && dueDateObj.getTime() > Date.now()
                    : false;

                  return {
                    id: a.id,
                    subject: a.subject?.name || 'Subject',
                    title: a.title,
                    due: dueDateObj ? dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date',
                    status: sub?.status === 'submitted' || sub?.status === 'graded' ? 'Submitted' : 'Pending',
                    urgent: isUrgent,
                    url: `/subjects/${a.subject_id}/assignments`,
                  };
                });
                setTasks(mappedTasks);
              }

              const { data: dbAnnouncements } = await supabase
                .from('announcements')
                .select(`
                  id,
                  title,
                  created_at,
                  author:profiles!author_id(full_name)
                `)
                .or(`target_type.eq.university,and(target_type.eq.subject,target_id.in.(${subjectIds.join(',')}))`)
                .order('created_at', { ascending: false })
                .limit(5);

              if (dbAnnouncements) {
                setUpdates(dbAnnouncements.map((a: any) => ({
                  id: a.id,
                  source: a.author?.full_name || 'Academic Notice',
                  title: a.title,
                  time: formatRelativeTime(new Date(a.created_at)),
                  url: '/announcements',
                })));
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [profile?.id, activeRole, activeUniversity?.id, supabase]);

  // ==========================================
  // RENDER: INSTITUTE HEAD DASHBOARD
  // ==========================================
  if (activeRole === 'institute_head') {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <header className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Institute Head
            </span>
            <span className="text-xs text-muted-foreground">{activeUniversity?.name || 'Institution Overview'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Academic communication and institution overview.
          </p>
        </header>

        {/* 4 Real Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/people?tab=students"
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Students</span>
              <GraduationCap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : instStats.totalStudents.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
              <span>View directory</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>

          <Link
            href="/people?tab=teachers"
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Faculty</span>
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : instStats.totalTeachers.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
              <span>Manage teachers</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>

          <Link
            href="/subjects"
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Subjects</span>
              <BookOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : instStats.totalSubjects.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
              <span>Oversee courses</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>

          <Link
            href="/moderation"
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Reports</span>
              <ShieldAlert className={`w-4 h-4 ${instStats.pendingReports > 0 ? 'text-amber-400 animate-pulse' : 'text-muted-foreground'} group-hover:scale-110 transition-transform`} />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : instStats.pendingReports.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
              <span>Review moderation</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        </section>

        {/* Two-Column Overview: Subjects & Moderation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Subjects & Teacher Assignment Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Academic Subjects</span>
              </h2>
              <Link
                href="/subjects"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>All subjects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
                Loading academic structure...
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
                No subjects registered in this institution yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {sub.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                        {sub.code}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span className="truncate">Faculty: <strong className="text-foreground font-medium">{sub.facultyName}</strong></span>
                      <span className="text-[11px] opacity-70 shrink-0">{sub.academicContext}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-border/40 text-xs">
                      <Link
                        href={`/chat/${sub.id}`}
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </Link>
                      <Link
                        href={`/subjects/${sub.id}`}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Moderation Queue & Announcements */}
          <div className="space-y-6">
            {/* Moderation Queue Card */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Moderation Queue</span>
                </h2>
                <Link
                  href="/moderation"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View all
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                  No pending moderation reports.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReports.map((r) => (
                    <Link
                      key={r.id}
                      href="/moderation"
                      className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 border border-white/5 transition-all block space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400 capitalize">{r.category}</span>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(new Date(r.created_at))}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{r.description || 'Reported message for review'}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Institutional Notices */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <span>Announcements</span>
                </h2>
                <Link
                  href="/announcements"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Manage
                </Link>
              </div>

              {updates.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                  No institutional announcements published.
                </div>
              ) : (
                <div className="space-y-2">
                  {updates.map((u) => (
                    <div key={u.id} className="p-2.5 rounded-xl bg-muted/30 border border-white/5 space-y-0.5">
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{u.title}</p>
                      <p className="text-[11px] text-muted-foreground">{u.source} • {u.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TEACHER DASHBOARD
  // ==========================================
  if (activeRole === 'teacher') {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Teacher Header */}
        <header className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Teacher
            </span>
            <span className="text-xs text-muted-foreground">Teaching Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Here is what needs your attention across your courses today.
          </p>
        </header>

        {/* Teacher Overview Metrics */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">My Subjects</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : subjects.length}
            </div>
            <div className="text-[11px] text-muted-foreground">Assigned courses</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Reviews</span>
              <ClipboardList className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : tasks.length}
            </div>
            <div className="text-[11px] text-muted-foreground">Submissions to grade</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Students</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : subjects.reduce((acc, s) => acc + (s.studentCount || 0), 0)}
            </div>
            <div className="text-[11px] text-muted-foreground">Enrolled across classes</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Course Notices</span>
              <Megaphone className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : updates.length}
            </div>
            <div className="text-[11px] text-muted-foreground">Recent announcements</div>
          </div>
        </section>

        {/* Main Teacher Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: My Subjects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>My Subjects</span>
              </h2>
              <Link
                href="/subjects"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
                Loading your assigned subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
                No subjects assigned to you yet. Your academic administrator will assign you to courses.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {sub.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                        {sub.code}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span className="font-medium text-foreground">{sub.studentCount} students enrolled</span>
                      <span className="text-[11px] opacity-70">{sub.academicContext}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs">
                      <Link
                        href={`/chat/${sub.id}`}
                        className="text-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Class Chat</span>
                      </Link>
                      <Link
                        href={`/subjects/${sub.id}`}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
                      >
                        <span>Coursework</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Assignment Submissions to Review */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  <span>Submissions Needing Review</span>
                </h2>
                <Link
                  href="/assignments"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  All assignments
                </Link>
              </div>

              {tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
                  No pending student submissions to review. You are completely caught up!
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">{task.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {task.studentName}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{task.subject} • Submitted {task.due}</p>
                      </div>

                      <Link
                        href={task.url}
                        className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-colors shrink-0"
                      >
                        Grade
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Announcements & Fast Actions */}
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <span>Recent Notices</span>
                </h2>
                <Link
                  href="/announcements"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Create
                </Link>
              </div>

              {updates.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                  No recent course announcements.
                </div>
              ) : (
                <div className="space-y-2">
                  {updates.map((u) => (
                    <div key={u.id} className="p-2.5 rounded-xl bg-muted/30 border border-white/5 space-y-0.5">
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{u.title}</p>
                      <p className="text-[11px] text-muted-foreground">{u.source} • {u.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: STUDENT DASHBOARD
  // ==========================================
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-10">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {greeting}, {firstName}.
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Here&rsquo;s what needs your attention today.
        </p>
      </header>

      {/* Subjects Section */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            Subjects
          </h2>
          <Link
            href="/subjects"
            className="text-xs text-primary hover:underline transition-colors flex items-center gap-1 font-medium active:scale-95"
          >
            <span>All subjects</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
            Loading your courses...
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
            You are not enrolled in any academic subjects yet.
          </div>
        ) : (
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="min-w-[240px] sm:min-w-0 p-3.5 sm:p-4 rounded-2xl bg-[#070E1B] sm:bg-card border border-white/10 sm:border-border/90 hover:border-border hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 sm:space-y-4 shadow-sm shrink-0 sm:shrink"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {sub.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                        {sub.facultyName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground shrink-0">
                    {sub.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 sm:border-border/60">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {sub.academicContext}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/chat/${sub.id}`}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </Link>
                    <span className="text-white/20">•</span>
                    <Link
                      href={`/subjects/${sub.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 active:scale-95"
                    >
                      <span>Course</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Two Columns: Upcoming Tasks & Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Tasks Section */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span>Upcoming Tasks</span>
            </h2>
            <Link
              href="/assignments"
              className="text-xs text-primary hover:underline transition-colors flex items-center gap-1 font-medium active:scale-95"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
              Loading coursework...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
              No pending tasks right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={task.url}
                  className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-3 group active:scale-98"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {task.subject}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{task.due}</span>
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        task.status === 'Submitted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : task.urgent
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Announcements Section */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <span>Announcements</span>
            </h2>
            <Link
              href="/announcements"
              className="text-xs text-primary hover:underline transition-colors flex items-center gap-1 font-medium active:scale-95"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
              Loading notices...
            </div>
          ) : updates.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
              No recent announcements.
            </div>
          ) : (
            <div className="space-y-2.5">
              {updates.map((update) => (
                <Link
                  key={update.id}
                  href={update.url}
                  className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-3 group active:scale-98"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {update.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {update.source}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {update.time}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

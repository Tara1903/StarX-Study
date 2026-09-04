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
  Sparkles
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface DashboardSubject {
  id: string;
  name: string;
  facultyName: string;
  color: string;
  code: string;
  academicContext: string;
}

interface DashboardTask {
  id: string;
  subject: string;
  title: string;
  due: string;
  status: string;
  urgent: boolean;
  url: string;
}

interface DashboardUpdate {
  id: string;
  source: string;
  title: string;
  time: string;
  url: string;
}

export default function DashboardPage() {
  const { profile } = useUser();
  const [greeting, setGreeting] = useState('Welcome');
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<DashboardTask[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<DashboardUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

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

        // 1. Fetch user's enrolled subjects
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
              code: `${deptCode}`,
              academicContext: `${semName}`,
            };
          });

          setSubjects(mappedSubjects);

          const subjectIds = dbMemberships.map((m: any) => m.subject.id);

          if (subjectIds.length > 0) {
            // 2. Fetch upcoming assignments for these subjects
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
              setUpcomingTasks(mappedTasks);
            }

            // 3. Fetch recent announcements
            const { data: dbAnnouncements } = await supabase
              .from('announcements')
              .select(`
                id,
                title,
                target_type,
                target_id,
                created_at,
                author:profiles!author_id(full_name)
              `)
              .or(`target_type.eq.university,and(target_type.eq.subject,target_id.in.(${subjectIds.join(',')}))`)
              .order('created_at', { ascending: false })
              .limit(5);

            if (dbAnnouncements) {
              const mappedUpdates = dbAnnouncements.map((a: any) => ({
                id: a.id,
                source: a.author?.full_name || 'Academic Notice',
                title: a.title,
                time: formatRelativeTime(new Date(a.created_at)),
                url: '/announcements',
              }));
              setRecentUpdates(mappedUpdates);
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
  }, [profile?.id, supabase]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 lg:space-y-10">
      {/* Clean Mobile-Optimized Greeting */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {greeting}, {firstName}.
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Here&rsquo;s what needs your attention today.
        </p>
      </header>

      {/* Subjects Quick Section - 1-tap horizontal scroll on mobile */}
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
                      <Link
                        href={`/subjects/${sub.id}/chat`}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {sub.name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {sub.facultyName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-white/10 sm:border-border/50 text-xs">
                  <span className="text-muted-foreground/80 text-[11px] font-mono">
                    {sub.code}
                  </span>
                  <Link
                    href={`/subjects/${sub.id}/chat`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Two-Column Section: Upcoming & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-1 sm:pt-2">
        {/* Upcoming */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Upcoming
            </h2>
            <Link
              href="/assignments"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <span>Assignments</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingTasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-xl">
                No upcoming assignments due.
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <Link
                  key={task.id}
                  href={task.url}
                  className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground block truncate">
                      {task.subject}
                    </span>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {task.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        task.urgent
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : task.status === 'Submitted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {task.due}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Recent
            </h2>
            <Link
              href="/announcements"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <span>Announcements</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentUpdates.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-xl">
                No recent announcements.
              </div>
            ) : (
              recentUpdates.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] font-medium text-primary block truncate">
                      {item.source}
                    </span>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.time}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

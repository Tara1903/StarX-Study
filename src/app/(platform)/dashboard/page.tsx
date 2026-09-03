'use client';

import { useUser } from '@/components/providers/user-provider';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { 
  BookOpen, 
  CalendarDays, 
  Clock, 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  User, 
  Bell, 
  ClipboardList,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { ECE_SUBJECTS, ECE_WEEKLY_SCHEDULE, TIME_SLOTS } from '@/lib/ece-data';

export default function DashboardPage() {
  const { profile, activeRole } = useUser();

  const getRoleBadgeColor = () => {
    switch (activeRole) {
      case 'institute_head': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'teacher': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  // Determine current day for timetable schedule preview
  const dayIndex = typeof window !== 'undefined' ? new Date().getDay() : 1;
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayMap[dayIndex] || 'Monday';
  
  // Find today's schedule or fallback to Monday
  const todaySchedule = ECE_WEEKLY_SCHEDULE.find(s => s.day === todayName) || ECE_WEEKLY_SCHEDULE[0];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-card via-card to-primary/5 border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-2xl shrink-0 shadow-inner">
            {getInitials(profile.full_name)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Welcome back, {profile.full_name}!
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${getRoleBadgeColor()}`}>
                {activeRole.replace('_', ' ')}
              </span>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <span>B.Tech Semester I • Electronics & Communication Engineering (ECE)</span>
              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span className="text-[#12CFEA]">Room No. 03</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/timetable"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-[#12CFEA] text-sm font-semibold transition-all shadow-sm"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Open Time Table</span>
          </Link>
        </div>
      </section>

      {/* Role-Specific Content */}
      {activeRole === 'student' && (
        <div className="space-y-8">
          {/* Main Grid: My Subjects & Timetable Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Subjects (Col span 2) */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    My Subjects (ECE Branch)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    6 Enrolled subjects for Semester I • SAGE University, Indore
                  </p>
                </div>
                <Link 
                  href="/subjects"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {ECE_SUBJECTS.map((sub) => (
                  <Link 
                    key={sub.id} 
                    href={`/subjects/${sub.id}`}
                    className="group p-4 rounded-xl border border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-background border border-border text-primary">
                          {sub.code}
                        </span>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {sub.name}
                        </h3>
                      </div>
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 mt-1" 
                        style={{ backgroundColor: sub.color }}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="truncate flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {sub.facultyAbb} • {sub.facultyName.split(' ')[1] || sub.facultyName}
                      </span>
                      <span className="text-[11px] font-medium text-foreground/80">
                        {sub.credits} Cr
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Today's Schedule Snapshot (Col span 1) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Today's Schedule
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {todaySchedule.day} • First Shift
                  </p>
                </div>
                <Link
                  href="/timetable"
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Full Table
                </Link>
              </div>

              <div className="space-y-2 flex-grow overflow-y-auto max-h-[320px] pr-1">
                {todaySchedule.periods.map((p, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-bold text-xs text-foreground truncate block">
                        {p.subjectName}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {p.facultyName || p.room || 'Scheduled Period'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{ 
                          backgroundColor: `${p.color || '#3B82F6'}20`,
                          color: p.color || '#3B82F6',
                        }}
                      >
                        {p.shortName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/timetable"
                className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                View Full Weekly Time Table
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Secondary Row: Upcoming Assignments & Announcements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-56">
              <h2 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Upcoming Assignments
              </h2>
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl p-4 text-center">
                <p>No pending assignments right now.</p>
                <span className="text-xs text-muted-foreground/70 mt-1">Course submissions will appear here once assigned by faculty.</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-56">
              <h2 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Recent Announcements
              </h2>
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl p-4 text-center">
                <p>Classes commenced w.e.f 19/08/2026.</p>
                <span className="text-xs text-primary font-medium mt-1">ECE Department Orientation & Welcome Session</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeRole === 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64">
            <h2 className="font-semibold text-lg mb-4">My Departments</h2>
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
              Loading departments...
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64 lg:col-span-2">
            <h2 className="font-semibold text-lg mb-4">Recent Submissions</h2>
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
              No recent submissions to grade
            </div>
          </div>
        </div>
      )}

      {activeRole === 'institute_head' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Students</h3>
            <p className="text-3xl font-bold">120</p>
            <span className="text-xs text-emerald-500 font-medium mt-2 block">ECE & Engineering</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Faculty</h3>
            <p className="text-3xl font-bold">6</p>
            <span className="text-xs text-emerald-500 font-medium mt-2 block">ECE Department</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Classes</h3>
            <p className="text-3xl font-bold">8 Periods/Day</p>
            <span className="text-xs text-muted-foreground mt-2 block">Shift 1 (08:30 - 16:30)</span>
          </div>
        </div>
      )}
    </div>
  );
}

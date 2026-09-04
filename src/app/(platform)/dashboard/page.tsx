'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/providers/user-provider';
import { 
  BookOpen, 
  MessageSquare, 
  ClipboardList, 
  Megaphone, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ECE_SUBJECTS } from '@/lib/ece-data';

export default function DashboardPage() {
  const { profile, activeRole } = useUser();
  const [greeting, setGreeting] = useState('Welcome');

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

  // Clean, focused upcoming tasks
  const upcomingTasks = [
    {
      id: 'task-1',
      subject: 'Engineering Graphics',
      title: 'Orthographic Projections Sheet 2',
      due: 'Tomorrow, 5:00 PM',
      status: 'Pending',
      urgent: true,
      url: '/subjects/graphics/assignments',
    },
    {
      id: 'task-2',
      subject: 'Mathematics-I',
      title: 'Problem Set 4 — Matrices & Rank',
      due: 'Friday',
      status: 'Pending',
      urgent: false,
      url: '/subjects/math-1/assignments',
    },
    {
      id: 'task-3',
      subject: 'Chemistry',
      title: 'Water Technology Practical Log',
      due: 'Next Monday',
      status: 'Submitted',
      urgent: false,
      url: '/subjects/chemistry/assignments',
    }
  ];

  // Clean, focused recent updates
  const recentUpdates = [
    {
      id: 'up-1',
      source: 'Chemistry',
      title: 'New lecture notes on Spectroscopy uploaded',
      time: '2h ago',
      url: '/subjects/chemistry/materials',
    },
    {
      id: 'up-2',
      source: 'Institute Notice',
      title: 'Mid-Term 1 Date Sheet published',
      time: 'Yesterday',
      url: '/announcements',
    },
    {
      id: 'up-3',
      source: 'Basic Electrical',
      title: 'DC Circuits lab batch list announced',
      time: '2 days ago',
      url: '/subjects/basic-electrical/announcements',
    }
  ];

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

        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {ECE_SUBJECTS.map((sub) => (
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
                <span className="text-muted-foreground/80 text-[11px]">
                  I Sem • ECE
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
            {upcomingTasks.map((task) => (
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
            ))}
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
            {recentUpdates.map((item) => (
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
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

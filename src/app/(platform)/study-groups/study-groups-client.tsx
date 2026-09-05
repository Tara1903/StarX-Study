'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  BookOpen,
  GraduationCap,
  Search,
  Users,
  FileText,
  ClipboardList,
  Megaphone,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StudyGroupSubject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  description?: string;
  facultyName: string;
  facultyAbb: string;
  studentCount?: number;
  unreadCount?: number;
}

export interface StudyGroupSemester {
  id: string;
  name: string;
  subjects: StudyGroupSubject[];
}

export interface StudyGroupProgram {
  id: string;
  name: string;
  code?: string;
  semesters: StudyGroupSemester[];
}

interface StudyGroupsClientProps {
  programs: StudyGroupProgram[];
  userRole?: string;
}

export function StudyGroupsClient({ programs, userRole = 'student' }: StudyGroupsClientProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs[0]?.id || ''
  );
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    programs[0]?.semesters[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Active Program
  const activeProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId) || programs[0];
  }, [programs, selectedProgramId]);

  // Available Semesters for current program
  const availableSemesters = useMemo(() => {
    return activeProgram?.semesters || [];
  }, [activeProgram]);

  // Active Semester
  const activeSemester = useMemo(() => {
    const found = availableSemesters.find((s) => s.id === selectedSemesterId);
    return found || availableSemesters[0];
  }, [availableSemesters, selectedSemesterId]);

  // Filtered Subjects
  const displayedSubjects = useMemo(() => {
    if (!activeSemester) return [];
    let list = activeSemester.subjects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.facultyName.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeSemester, searchQuery]);

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center max-w-md mx-auto space-y-4 my-12">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            No study groups available
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {userRole === 'teacher'
              ? 'You have not been assigned to any course cohorts yet. Your administrator will link you to teaching groups.'
              : 'You are not currently enrolled in any academic study groups. Once your department administrator enrolls you, your class communication groups will appear here.'}
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-sm hover:bg-primary/90 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Go to Chats</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Study Groups
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Academic communication hierarchy • Select your subject room to open chat
          </p>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects or teachers..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white/[0.07] transition-all"
          />
        </div>
      </div>

      {/* Program Hierarchy Level (e.g. B.Tech / Department) */}
      {programs.length > 1 && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            1. Select Program / Course
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {programs.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => {
                  setSelectedProgramId(program.id);
                  setSelectedSemesterId(program.semesters[0]?.id || '');
                }}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2',
                  selectedProgramId === program.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
                )}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{program.name}</span>
                {program.code && (
                  <span className="text-[10px] opacity-75 font-mono">({program.code})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Semester Hierarchy Level */}
      {availableSemesters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {programs.length > 1 ? '2. Select Semester' : 'Academic Semester'}
            </label>
            {activeProgram && (
              <span className="text-xs text-muted-foreground font-medium">
                {activeProgram.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {availableSemesters.map((semester) => (
              <button
                key={semester.id}
                type="button"
                onClick={() => setSelectedSemesterId(semester.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5',
                  selectedSemesterId === semester.id
                    ? 'bg-white/15 text-foreground border border-white/20 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5'
                )}
              >
                <span>{semester.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-bold">
                  {semester.subjects.length} subjects
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject Communication List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>
              {activeSemester?.name || 'Subjects'} — Course Chats
            </span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {displayedSubjects.length} subjects available
          </span>
        </div>

        {displayedSubjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-white/[0.02] border border-white/5 rounded-2xl">
            {searchQuery
              ? `No subjects match "${searchQuery}" in this semester.`
              : 'No subjects available for this semester.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedSubjects.map((sub) => {
              const accentColor = sub.color || '#3B82F6';

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3.5 group shadow-sm relative overflow-hidden"
                >
                  {/* Color strip accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: accentColor }}
                  />

                  {/* Header: Subject Name + Faculty */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {sub.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Faculty:{' '}
                        <strong className="text-foreground font-medium">
                          {sub.facultyName}
                        </strong>
                        {sub.facultyAbb && (
                          <span className="ml-1 text-[11px] font-mono text-primary">
                            [{sub.facultyAbb}]
                          </span>
                        )}
                      </p>
                    </div>

                    {sub.code && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5 shrink-0">
                        {sub.code}
                      </span>
                    )}
                  </div>

                  {/* Secondary Context & Description if present */}
                  {sub.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                      {sub.description}
                    </p>
                  )}

                  {/* Action Bar: PRIMARY CHAT DESTINATION + Secondary links */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                    {/* Secondary Quick Links */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link
                        href={`/subjects/${sub.id}/materials`}
                        title="Course Materials"
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Docs</span>
                      </Link>
                      <span className="opacity-30">•</span>
                      <Link
                        href={`/subjects/${sub.id}/assignments`}
                        title="Assignments"
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tasks</span>
                      </Link>
                    </div>

                    {/* PRIMARY ACTION: Open Subject Chat */}
                    <Link
                      href={`/chat/${sub.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

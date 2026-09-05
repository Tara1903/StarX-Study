'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ClipboardList, 
  Plus, 
  GraduationCap, 
  Users,
  Search
} from 'lucide-react';
import { CreateAssignmentDialog } from '@/components/assignments/create-assignment-dialog';
import type { UserRole } from '@/types/database';

export interface AssignmentListItem {
  id: string;
  subjectId: string;
  subjectName: string;
  color: string;
  title: string;
  description?: string | null;
  due: string;
  dueDateRaw?: string | null;
  status: string;
  urgent: boolean;
  maxMarks?: number | null;
  totalStudents?: number;
  submittedCount?: number;
  gradedCount?: number;
  myMarks?: number | null;
}

interface AssignmentsPageClientProps {
  assignments: AssignmentListItem[];
  userRole: UserRole;
  availableSubjects?: { id: string; name: string }[];
}

export function AssignmentsPageClient({
  assignments,
  userRole,
  availableSubjects = [],
}: AssignmentsPageClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const isTeacherOrHead = userRole === 'teacher' || userRole === 'institute_head';

  const filtered = assignments.filter((a) => {
    const matchesSearch =
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filter === 'pending') {
      matchesFilter = a.status === 'Pending';
    } else if (filter === 'completed') {
      matchesFilter = a.status !== 'Pending';
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header with Title and Create Action */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 sm:border-border">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isTeacherOrHead
              ? 'Coursework management, student submissions, and grading'
              : 'Your active coursework & submissions'}
          </p>
        </div>

        {isTeacherOrHead && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title or subject..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {!isTeacherOrHead && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border shrink-0">
            {(['all', 'pending', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Cards List */}
      {assignments.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">
            {isTeacherOrHead ? 'No Assignments Created' : 'No Enrolled Coursework'}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isTeacherOrHead
              ? 'You have not created any assignments yet. Use the button above to post your first assignment to a class.'
              : 'You have no coursework assigned right now. When instructors post assignments, they will appear here.'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
          No assignments match your search filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const detailUrl = `/subjects/${item.subjectId}/assignments/${item.id}`;

            return (
              <Link
                key={item.id}
                href={detailUrl}
                className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all block space-y-3 shadow-sm group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-muted-foreground truncate">
                        {item.subjectName}
                      </span>
                      {item.maxMarks && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                          {item.maxMarks} pts
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Submission status or counts */}
                    {isTeacherOrHead ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-muted/60 text-foreground font-semibold flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.submittedCount ?? 0}/{item.totalStudents ?? 0} turned in</span>
                        </span>
                        {(item.submittedCount || 0) > (item.gradedCount || 0) && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px] border border-amber-500/20">
                            {(item.submittedCount || 0) - (item.gradedCount || 0)} to grade
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                          item.status.includes('Graded')
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : item.status === 'Submitted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted/70 text-muted-foreground'
                        }`}
                      >
                        {item.status.includes('Graded') && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{item.status}</span>
                      </span>
                    )}

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.due}</span>
                    </span>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 border-t border-border/40 pt-2">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Assignment Dialog */}
      {isCreateOpen && (
        <CreateAssignmentDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          availableSubjects={availableSubjects}
        />
      )}
    </div>
  );
}

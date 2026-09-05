'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MessageSquare, 
  ChevronRight,
  Calculator,
  FlaskConical,
  Zap,
  Compass,
  Code,
  Cpu,
  BookOpen,
  Plus,
  UserCheck,
  Users,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { createSubject, assignSubjectTeacher } from '@/actions/admin';
import type { UserRole } from '@/types/database';

export interface SubjectCardData {
  id: string;
  code: string;
  name: string;
  shortName: string;
  facultyName: string;
  facultyAbb: string;
  credits: number;
  color: string;
  description: string;
  room: string;
  icon: string;
  type: 'theory' | 'lab' | 'hybrid';
  studentCount?: number;
  unreadCount?: number;
  teacherUserId?: string | null;
}

interface SubjectsListClientProps {
  subjects: SubjectCardData[];
  userRole?: UserRole;
  universityId?: string;
  availableTeachers?: { id: string; name: string }[];
  availableSemesters?: { id: string; name: string; deptName: string }[];
}

export function SubjectsListClient({ 
  subjects,
  userRole = 'student',
  universityId,
  availableTeachers = [],
  availableSemesters = []
}: SubjectsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Create Subject Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectSemesterId, setNewSubjectSemesterId] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);

  // Assign Teacher Modal State
  const [assigningSubject, setAssigningSubject] = useState<SubjectCardData | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const getSubjectIcon = (iconName: string, name: string) => {
    const lower = (name + ' ' + iconName).toLowerCase();
    if (lower.includes('math') || lower.includes('calc')) return Calculator;
    if (lower.includes('chem')) return FlaskConical;
    if (lower.includes('elect')) return Zap;
    if (lower.includes('graph')) return Compass;
    if (lower.includes('code') || lower.includes('prog')) return Code;
    if (lower.includes('circuit') || lower.includes('esdm')) return Cpu;
    return BookOpen;
  };

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.facultyName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectSemesterId || !universityId) {
      toast.error('Please enter a subject name and select an academic term');
      return;
    }

    try {
      setIsCreating(true);
      const fd = new FormData();
      fd.append('name', newSubjectName.trim());
      fd.append('semesterId', newSubjectSemesterId);
      fd.append('universityId', universityId);

      const res = await createSubject(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Subject "${newSubjectName}" created successfully`);
      setIsCreateOpen(false);
      setNewSubjectName('');
      setNewSubjectSemesterId('');
    } catch {
      toast.error('Failed to create subject');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSubject || !selectedTeacherId || !universityId) {
      toast.error('Please select a faculty member');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await assignSubjectTeacher(assigningSubject.id, selectedTeacherId, universityId);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Faculty assigned to ${assigningSubject.name}`);
      setAssigningSubject(null);
      setSelectedTeacherId('');
    } catch {
      toast.error('Failed to assign faculty');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects by name, faculty, or code..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {userRole === 'institute_head' && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subject</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {subjects.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-sm text-muted-foreground bg-card/40 border border-border/60 rounded-2xl max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">
            {userRole === 'teacher' ? 'No Assigned Subjects' : 'No Subjects Registered'}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {userRole === 'teacher'
              ? 'You have not been assigned as an instructor to any subjects yet. Your institute administrator will assign you to courses.'
              : userRole === 'institute_head'
              ? 'No academic subjects have been added to this institution yet. Use the "Create Subject" button above to add your first course.'
              : 'You are not enrolled in any academic subjects yet. Once your department administrator or instructor adds you to course rosters, your subjects will appear here.'}
          </p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-sm text-muted-foreground bg-card/40 border border-border/60 rounded-2xl">
          No subjects match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => {
            const Icon = getSubjectIcon(sub.icon, sub.name);
            const unread = sub.unreadCount || 0;

            return (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header: Color + Code + Unread */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Faculty: <strong className="text-foreground font-medium">{sub.facultyName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
                      {sub.code}
                    </span>
                    {unread > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{sub.studentCount ?? 0} students</span>
                  </span>
                  <span className="text-[11px] opacity-75">{sub.room}</span>
                </div>

                {/* Footer Action Links */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/chat/${sub.id}`}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </Link>
                    <span className="text-muted-foreground/40">•</span>
                    <Link
                      href={`/subjects/${sub.id}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
                    >
                      <span>Coursework</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {userRole === 'institute_head' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningSubject(sub);
                        setSelectedTeacherId(sub.teacherUserId || '');
                      }}
                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>{sub.facultyName === 'Unassigned' ? 'Assign' : 'Change'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SUBJECT MODAL (Institute Head) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Create New Subject</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics-I, Digital Signal Processing"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Academic Term / Semester</label>
                <select
                  required
                  value={newSubjectSemesterId}
                  onChange={(e) => setNewSubjectSemesterId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>Select semester...</option>
                  {availableSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id} className="bg-card text-foreground">
                      {sem.deptName} — {sem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN FACULTY MODAL (Institute Head) */}
      {assigningSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Assign Faculty Member</h2>
              <button
                type="button"
                onClick={() => setAssigningSubject(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select the instructor responsible for <strong className="text-foreground">{assigningSubject.name}</strong> coursework and communication.
            </p>

            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Faculty Member</label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>Select instructor...</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id} className="bg-card text-foreground">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setAssigningSubject(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

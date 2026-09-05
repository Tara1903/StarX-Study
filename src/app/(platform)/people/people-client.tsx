'use client';

import { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  Plus, 
  X, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Mail,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { assignSubjectTeacher, enrollSubjectStudent } from '@/actions/admin';
import { UserAvatar } from '@/components/ui/user-avatar';

export interface PersonItem {
  id: string; // user_id
  membershipId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: 'teacher' | 'student';
  subjects: { id: string; name: string }[];
  joinedAt: string;
}

interface PeopleClientProps {
  universityId: string;
  universityName: string;
  teachers: PersonItem[];
  students: PersonItem[];
  availableSubjects: { id: string; name: string }[];
}

export function PeopleClient({
  universityId,
  universityName,
  teachers,
  students,
  availableSubjects,
}: PeopleClientProps) {
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Subject Modal
  const [assigningTeacher, setAssigningTeacher] = useState<PersonItem | null>(null);
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Enroll Student Modal
  const [enrollingStudent, setEnrollingStudent] = useState<PersonItem | null>(null);
  const [enrollSubjectId, setEnrollSubjectId] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const activeList = activeTab === 'teachers' ? teachers : students;

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.toLowerCase();
    return activeList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.subjects.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [activeList, searchQuery]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeacher || !targetSubjectId) {
      toast.error('Please select a subject to assign');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await assignSubjectTeacher(targetSubjectId, assigningTeacher.id, universityId);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`${assigningTeacher.name} assigned to subject`);
      setAssigningTeacher(null);
      setTargetSubjectId('');
    } catch {
      toast.error('Failed to assign faculty member');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingStudent || !enrollSubjectId) {
      toast.error('Please select a subject to enroll the student');
      return;
    }

    try {
      setIsEnrolling(true);
      const res = await enrollSubjectStudent(enrollSubjectId, enrollingStudent.id, universityId);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`${enrollingStudent.name} enrolled in subject`);
      setEnrollingStudent(null);
      setEnrollSubjectId('');
    } catch {
      toast.error('Failed to enroll student');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-white/10 sm:border-border">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Institution Directory
          </span>
          <span className="text-xs text-muted-foreground">{universityName}</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          People
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage faculty instruction and student course rosters.
        </p>
      </header>

      {/* Segmented Control and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Faculty ({teachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Students ({students.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* People Roster */}
      {activeList.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">
            No {activeTab === 'teachers' ? 'Faculty Members' : 'Students'} Found
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No accounts are registered under this role in your institution yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
          No {activeTab} match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((person) => (
            <div
              key={person.id}
              className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                    {person.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {person.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span>{person.email}</span>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground shrink-0">
                  {person.role}
                </span>
              </div>

              {/* Subjects tags */}
              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {activeTab === 'teachers' ? 'Taught Courses' : 'Enrolled Courses'} ({person.subjects.length}):
                </span>
                {person.subjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No courses assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {person.subjects.map((sub) => (
                      <span
                        key={sub.id}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/70 text-foreground"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-border/40">
                {activeTab === 'teachers' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAssigningTeacher(person);
                      setTargetSubjectId(availableSubjects[0]?.id || '');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Assign to Subject</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollingStudent(person);
                      setEnrollSubjectId(availableSubjects[0]?.id || '');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Enroll in Subject</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN TEACHER MODAL */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-base font-bold text-foreground">Assign Faculty to Course</h2>
              <button
                type="button"
                onClick={() => setAssigningTeacher(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select an academic course to assign to <strong className="text-foreground">{assigningTeacher.name}</strong>.
            </p>

            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subject Course</label>
                <select
                  required
                  value={targetSubjectId}
                  onChange={(e) => setTargetSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>Select course...</option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card text-foreground">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL STUDENT MODAL */}
      {enrollingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-base font-bold text-foreground">Enroll Student in Course</h2>
              <button
                type="button"
                onClick={() => setEnrollingStudent(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Add <strong className="text-foreground">{enrollingStudent.name}</strong> to the roster of an academic subject.
            </p>

            <form onSubmit={handleEnroll} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subject Course</label>
                <select
                  required
                  value={enrollSubjectId}
                  onChange={(e) => setEnrollSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>Select course...</option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card text-foreground">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEnrollingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isEnrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

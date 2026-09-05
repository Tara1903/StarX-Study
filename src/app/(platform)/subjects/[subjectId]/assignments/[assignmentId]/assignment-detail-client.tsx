'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  FileText, 
  GraduationCap, 
  Loader2, 
  Check, 
  User,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { submitAssignment, gradeSubmission } from '@/actions/assignments';
import { formatRelativeTime } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';

export interface StudentSubmissionItem {
  id: string; // submission id (or empty if pending)
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string | null;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  content?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  submittedAt?: string | null;
  marks?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
}

interface AssignmentDetailClientProps {
  subjectId: string;
  subjectName: string;
  assignment: {
    id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    maxMarks?: number | null;
    dueDate?: string | null;
  };
  isTeacher: boolean;
  totalStudents: number;
  submissions: StudentSubmissionItem[];
  mySubmission?: StudentSubmissionItem | null;
}

export function AssignmentDetailClient({
  subjectId,
  subjectName,
  assignment,
  isTeacher,
  totalStudents,
  submissions,
  mySubmission,
}: AssignmentDetailClientProps) {
  // Student submission form state
  const [submissionText, setSubmissionText] = useState(mySubmission?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Teacher grading states (keyed by submissionId)
  const [gradingState, setGradingState] = useState<Record<string, { marks: string; feedback: string; loading: boolean }>>(() => {
    const initial: Record<string, { marks: string; feedback: string; loading: boolean }> = {};
    submissions.forEach((s) => {
      if (s.id) {
        initial[s.id] = {
          marks: s.marks !== null && s.marks !== undefined ? String(s.marks) : '',
          feedback: s.feedback || '',
          loading: false,
        };
      }
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'pending' | 'graded'>('all');

  const submittedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length;
  const gradedCount = submissions.filter((s) => s.status === 'graded').length;
  const pendingCount = Math.max(0, totalStudents - submittedCount);

  // Handle student submit
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim()) {
      toast.error('Please enter your submission text or response');
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('assignment_id', assignment.id);
      fd.append('content', submissionText.trim());

      const res = await submitAssignment(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Assignment submitted successfully!');
    } catch {
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle teacher grade
  const handleSaveGrade = async (submissionId: string) => {
    const item = gradingState[submissionId];
    if (!item || item.marks === '') {
      toast.error('Please enter marks to grade');
      return;
    }

    const marksNum = Number(item.marks);
    if (isNaN(marksNum) || marksNum < 0) {
      toast.error('Marks must be a valid non-negative number');
      return;
    }

    if (assignment.maxMarks && marksNum > assignment.maxMarks) {
      toast.error(`Marks cannot exceed maximum score of ${assignment.maxMarks}`);
      return;
    }

    try {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], loading: true },
      }));

      const fd = new FormData();
      fd.append('submission_id', submissionId);
      fd.append('marks', String(marksNum));
      fd.append('feedback', item.feedback.trim());
      fd.append('status', 'graded');

      const res = await gradeSubmission(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Grade and feedback saved');
    } catch {
      toast.error('Failed to save grade');
    } finally {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], loading: false },
      }));
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === 'submitted') return s.status === 'submitted';
    if (activeTab === 'graded') return s.status === 'graded';
    if (activeTab === 'pending') return s.status === 'pending';
    return true;
  });

  const dueDateObj = assignment.dueDate ? new Date(assignment.dueDate) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/subjects/${subjectId}/assignments`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assignments</span>
        </Link>
      </div>

      {/* Main Header & Assignment Details Card */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              {subjectName}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {assignment.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {assignment.maxMarks && (
              <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                {assignment.maxMarks} Points
              </span>
            )}
            <span className="px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground font-medium text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {dueDateObj
                  ? `Due ${dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'No deadline'}
              </span>
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Instructions & Overview
          </h2>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {assignment.instructions || assignment.description || 'No detailed instructions provided.'}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TEACHER EXPERIENCE: SUBMISSION MANAGEMENT & GRADING          */}
      {/* ============================================================ */}
      {isTeacher ? (
        <div className="space-y-6">
          {/* Submission Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Students</span>
              <div className="text-2xl font-bold text-foreground">{totalStudents}</div>
              <div className="text-[11px] text-muted-foreground">Enrolled in class</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Turned In</span>
              <div className="text-2xl font-bold text-emerald-400">{submittedCount}</div>
              <div className="text-[11px] text-muted-foreground">Completed submissions</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Graded</span>
              <div className="text-2xl font-bold text-blue-400">{gradedCount}</div>
              <div className="text-[11px] text-muted-foreground">Evaluated with feedback</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Pending</span>
              <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
              <div className="text-[11px] text-muted-foreground">Awaiting submission</div>
            </div>
          </div>

          {/* Submissions List Header & Filter Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Student Submissions</span>
              </h2>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
                {(['all', 'submitted', 'graded', 'pending'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions Roster */}
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card/40 border border-border/60 rounded-2xl">
                No submissions found for the selected filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => {
                  const itemState = gradingState[sub.id] || { marks: '', feedback: '', loading: false };

                  return (
                    <div
                      key={sub.studentId}
                      className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center font-bold text-xs text-foreground">
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{sub.studentName}</h3>
                            <p className="text-xs text-muted-foreground">{sub.studentEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                              sub.status === 'graded'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : sub.status === 'submitted'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {sub.status === 'graded'
                              ? `Graded (${sub.marks}/${assignment.maxMarks || 100})`
                              : sub.status === 'submitted'
                              ? 'Turned In'
                              : 'Pending Submission'}
                          </span>

                          {sub.submittedAt && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeTime(new Date(sub.submittedAt))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Submitted Content Preview */}
                      {sub.content && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Submitted Content
                          </span>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap">{sub.content}</p>
                        </div>
                      )}

                      {/* Teacher Grading & Feedback Inputs (Only if turned in) */}
                      {sub.id && (sub.status === 'submitted' || sub.status === 'graded') && (
                        <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              Score (Max {assignment.maxMarks || 100})
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={assignment.maxMarks || 100}
                              value={itemState.marks}
                              onChange={(e) =>
                                setGradingState((prev) => ({
                                  ...prev,
                                  [sub.id]: { ...prev[sub.id], marks: e.target.value },
                                }))
                              }
                              placeholder="Score"
                              className="w-full p-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>

                          <div className="sm:col-span-7 space-y-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              Instructor Feedback
                            </label>
                            <input
                              type="text"
                              value={itemState.feedback}
                              onChange={(e) =>
                                setGradingState((prev) => ({
                                  ...prev,
                                  [sub.id]: { ...prev[sub.id], feedback: e.target.value },
                                }))
                              }
                              placeholder="Feedback on accuracy, effort, or improvements..."
                              className="w-full p-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => handleSaveGrade(sub.id)}
                              disabled={itemState.loading}
                              className="w-full py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              {itemState.loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Grade</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* STUDENT EXPERIENCE: VIEW SUBMISSION & SUBMIT WORK            */
        /* ============================================================ */
        <div className="space-y-6">
          {mySubmission && mySubmission.status === 'graded' ? (
            <div className="p-6 rounded-2xl bg-card border border-blue-500/20 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-foreground">Graded Submission</h2>
                </div>
                <span className="text-sm font-bold px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {mySubmission.marks} / {assignment.maxMarks || 100} Points
                </span>
              </div>

              {mySubmission.feedback && (
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Faculty Feedback
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed">{mySubmission.feedback}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-muted/30 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Your Answer
                </span>
                <p className="text-xs text-foreground/90 whitespace-pre-wrap">{mySubmission.content}</p>
              </div>
            </div>
          ) : mySubmission && mySubmission.status === 'submitted' ? (
            <div className="p-6 rounded-2xl bg-card border border-emerald-500/20 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-foreground">Turned In</h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Awaiting Evaluation
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Submitted Answer
                </span>
                <p className="text-xs text-foreground/90 whitespace-pre-wrap">{mySubmission.content}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Submitted {mySubmission.submittedAt ? formatRelativeTime(new Date(mySubmission.submittedAt)) : 'recently'}. Your instructor will review and grade your coursework.
              </p>
            </div>
          ) : (
            <form onSubmit={handleStudentSubmit} className="p-6 rounded-2xl bg-card border border-border/80 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Your Submission</span>
              </h2>

              <p className="text-xs text-muted-foreground">
                Type or paste your completed assignment solution below.
              </p>

              <textarea
                rows={6}
                required
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Write your assignment solution, code, derivation, or response here..."
                className="w-full p-3.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Turn In Assignment</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

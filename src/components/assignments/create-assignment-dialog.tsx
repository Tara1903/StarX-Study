'use client';

import { useState } from 'react';
import { X, Loader2, Plus, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createAssignment } from '@/actions/assignments';

interface CreateAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
  availableSubjects?: { id: string; name: string }[];
}

export function CreateAssignmentDialog({
  isOpen,
  onClose,
  defaultSubjectId,
  availableSubjects = [],
}: CreateAssignmentDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubject = defaultSubjectId || selectedSubjectId;
    if (!targetSubject || !title.trim()) {
      toast.error('Please specify a subject and assignment title');
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('subject_id', targetSubject);
      fd.append('title', title.trim());
      if (description.trim()) fd.append('description', description.trim());
      if (instructions.trim()) fd.append('instructions', instructions.trim());
      if (maxMarks) fd.append('max_marks', maxMarks);
      if (dueDate) fd.append('due_date', new Date(dueDate).toISOString());

      const res = await createAssignment(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Assignment "${title}" posted successfully`);
      onClose();
      setTitle('');
      setDescription('');
      setInstructions('');
      setDueDate('');
    } catch {
      toast.error('Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Create Assignment</h2>
              <p className="text-xs text-muted-foreground">Post coursework and define evaluation criteria</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Selector (if not preselected) */}
          {!defaultSubjectId && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subject Course</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>Select subject course...</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card text-foreground">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Assignment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Problem Set, Lab Report 2"
              className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Max Marks (Points)</label>
              <input
                type="number"
                min="1"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Due Date & Time</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Instructions & Description</label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide clear submission instructions, guidelines, and reference links..."
              className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Post Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

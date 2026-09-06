"use client";

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  MessageCircle, 
  Send,
  Clock,
  X,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Plus,
  Loader2,
  Megaphone
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { createAnnouncement } from '@/actions/announcements';
import type { UserRole } from '@/types/database';

export interface MainAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'urgent' | 'important' | 'general';
  scope: string;
  author: string;
  authorRole: string;
  date: string;
  isPinned: boolean;
  attachmentName?: string;
  attachmentSize?: string;
  commentsCount?: number;
  readByMe?: boolean;
}

interface AnnouncementsClientProps {
  initialData?: MainAnnouncement[];
  userRole?: UserRole;
  universityId?: string;
  authorizedSubjects?: { id: string; name: string }[];
}

export function AnnouncementsClient({ 
  initialData,
  userRole = 'student',
  universityId,
  authorizedSubjects = []
}: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<MainAnnouncement[]>(() => {
    return initialData || [];
  });

  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<MainAnnouncement | null>(null);

  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [targetType, setTargetType] = useState<'university' | 'subject'>(
    userRole === 'teacher' ? 'subject' : 'university'
  );
  const [targetSubjectId, setTargetSubjectId] = useState(authorizedSubjects[0]?.id || '');
  const [isPublishing, setIsPublishing] = useState(false);

  const isTeacherOrHead = userRole === 'teacher' || userRole === 'institute_head';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('starx_main_announcements', JSON.stringify(announcements));
    }
  }, [announcements]);

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      const matchesFilter = filter === 'all' || a.category === filter;
      const matchesSearch =
        !searchQuery.trim() ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [announcements, filter, searchQuery]);

  const handleOpenDetail = (ann: MainAnnouncement) => {
    setSelectedAnnouncement(ann);
    if (!ann.readByMe) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, readByMe: true } : a))
      );
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    if (!universityId) {
      toast.error('Institution context not found');
      return;
    }

    const resolvedTargetType = userRole === 'teacher' ? 'subject' : targetType;
    const resolvedTargetId = resolvedTargetType === 'university' ? universityId : targetSubjectId;

    if (resolvedTargetType === 'subject' && !resolvedTargetId) {
      toast.error('Please select an authorized subject course');
      return;
    }

    try {
      setIsPublishing(true);
      const fd = new FormData();
      fd.append('university_id', universityId);
      fd.append('title', newTitle.trim());
      fd.append('content', newContent.trim());
      fd.append('priority', newPriority);
      fd.append('target_type', resolvedTargetType);
      fd.append('target_id', resolvedTargetId);

      const res = await createAnnouncement(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Announcement published successfully');
      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewPriority('normal');
    } catch {
      toast.error('Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 sm:border-border">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Announcements
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isTeacherOrHead ? 'Publish official notices and academic updates' : 'Campus & academic updates'}
          </p>
        </div>

        {isTeacherOrHead && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </header>

      {/* Search & Minimal Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices by title or author..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border shrink-0">
          {(['all', 'urgent', 'important', 'general'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">No Announcements</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There are no active notices or announcements at this time.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
          No announcements match your search filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all cursor-pointer space-y-3 shadow-sm group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.category === 'urgent'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : item.category === 'important'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium truncate">
                      {item.scope}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>
                </div>

                <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(new Date(item.date))}</span>
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                <span className="truncate">By <strong className="text-foreground font-medium">{item.author}</strong></span>
                <span className="text-primary group-hover:underline flex items-center gap-1 font-medium">
                  <span>Read details</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/40">
              <div className="space-y-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedAnnouncement.category === 'urgent'
                      ? 'bg-red-500/10 text-red-400'
                      : selectedAnnouncement.category === 'important'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {selectedAnnouncement.category}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {selectedAnnouncement.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedAnnouncement.author} • {formatRelativeTime(new Date(selectedAnnouncement.date))}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed py-2">
              {selectedAnnouncement.content}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Publish Announcement</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              {/* Audience Scope */}
              {userRole === 'institute_head' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Target Audience</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetType('university')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        targetType === 'university'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Entire Institution
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('subject')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        targetType === 'subject'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Specific Subject
                    </button>
                  </div>
                </div>
              )}

              {(userRole === 'teacher' || targetType === 'subject') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {userRole === 'teacher' ? 'Your Subject Course' : 'Target Subject'}
                  </label>
                  <select
                    required
                    value={targetSubjectId}
                    onChange={(e) => setTargetSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>Select subject...</option>
                    {authorizedSubjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-card text-foreground">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Test Schedule, Class Postponed"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'important', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        newPriority === p
                          ? p === 'urgent'
                            ? 'bg-red-500/10 border-red-500/40 text-red-400'
                            : p === 'important'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-primary/10 border-primary/40 text-primary'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Announcement Text</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write clear, detailed notice content for recipients..."
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
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
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isPublishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

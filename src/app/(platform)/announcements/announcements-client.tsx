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
  Sparkles
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

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

const INITIAL_ANNOUNCEMENTS: MainAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Semester Examination & Mid-Term 1 Schedule (July-Dec 2026)',
    content: 'The official Mid-Term Examination 1 date sheet for B.Tech Semester 1 (ECE & allied branches) has been published by the Controller of Examinations. Exams commence from October 12, 2026. Students must carry their institutional ID cards and arrive at least 15 minutes before reporting time (08:30 AM). Detailed slot-wise timetable is attached below.',
    category: 'urgent',
    scope: 'IET, SAGE University • ECE Department',
    author: 'Dr. Exam Controller',
    authorRole: 'Examination Cell, SAGE University',
    date: '2026-09-02T09:30:00Z',
    isPinned: true,
    attachmentName: 'BTech_Sem1_MidTerm1_Schedule_2026.pdf',
    attachmentSize: '1.8 MB',
    commentsCount: 2,
    readByMe: false,
  },
  {
    id: 'ann-2',
    title: 'Mandatory 75% Attendance Requirement Notice',
    content: 'In accordance with University Academic Regulations, a minimum of 75% attendance across all theory and laboratory sessions (Mathematics-I, Chemistry, Basic Electrical, Engineering Graphics, PCES-I, ESDM) is strictly mandatory to be eligible for end-semester examinations. Students with attendance between 60%-74% must submit validated medical documents to their mentor.',
    category: 'important',
    scope: 'Faculty of Engineering & Technology (IET)',
    author: 'Prof. Academic Dean',
    authorRole: 'Dean Academic Affairs',
    date: '2026-09-01T11:00:00Z',
    isPinned: true,
    attachmentName: 'Academic_Attendance_Policy_Guidelines.pdf',
    attachmentSize: '950 KB',
    commentsCount: 1,
    readByMe: false,
  },
  {
    id: 'ann-3',
    title: 'Engineering Graphics & Chemistry Laboratory Safety Protocols',
    content: 'All First-Year ECE students attending practical sessions in Room No. 03 / Chemistry Lab-I / Drawing Hall must strictly adhere to campus safety norms. White lab coats and safety goggles are compulsory for Chemistry sessions; mini-drafters and calibrated scales are required for Drawing practicals.',
    category: 'important',
    scope: 'ECE Department Laboratories',
    author: 'Prof. Garima Pawar & Prof. Vikas Bakshi',
    authorRole: 'Lab Superintendents',
    date: '2026-08-30T14:20:00Z',
    isPinned: false,
    commentsCount: 0,
    readByMe: true,
  },
  {
    id: 'ann-4',
    title: 'Central Library Extended Evening Reading Room Timings',
    content: 'To facilitate study and reference work during the academic term, the Central Engineering Library (Block A) reading hall will remain accessible until 09:30 PM on weekdays and 06:00 PM on Saturdays. Access requires biometrics and student smart-card.',
    category: 'general',
    scope: 'Campus Facility • All Students',
    author: 'Chief Librarian',
    authorRole: 'SAGE Central Library',
    date: '2026-08-28T16:00:00Z',
    isPinned: false,
    commentsCount: 0,
    readByMe: true,
  },
];

export function AnnouncementsClient({ initialData }: { initialData?: MainAnnouncement[] }) {
  const [announcements, setAnnouncements] = useState<MainAnnouncement[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studchat_main_announcements');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return initialData && initialData.length > 0 ? initialData : INITIAL_ANNOUNCEMENTS;
  });

  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<MainAnnouncement | null>(null);

  const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>({
    'ann-1': [
      { id: 'c1', author: 'Rahul Verma (ECE-104)', text: 'Is the calculator model FX-991EX permitted in Mathematics-I exam?', time: 'Yesterday' },
      { id: 'c2', author: 'Prof. Ruchi Shrivastava', text: 'Yes, non-programmable scientific calculators are permitted for Unit 1 and Unit 2.', time: 'Yesterday' },
    ],
  });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studchat_main_announcements', JSON.stringify(announcements));
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

  const handleAddComment = (annId: string) => {
    if (!newComment.trim()) return;
    setCommentsMap((prev) => ({
      ...prev,
      [annId]: [
        ...(prev[annId] || []),
        { id: `c_${Date.now()}`, author: 'You', text: newComment.trim(), time: 'Just now' }
      ]
    }));
    setNewComment('');
    toast.success('Comment posted');
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Announcements
        </h1>
        <p className="text-sm text-muted-foreground">
          Campus & academic updates
        </p>
      </header>

      {/* Search & Minimal Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-9 pr-4 py-1.5 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {(['all', 'urgent', 'important', 'general'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List (Section 29 standard: clean list rows, no full-paragraph dumps in feed) */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
            No announcements found.
          </div>
        ) : (
          filtered.map((item) => {
            const isUrgent = item.category === 'urgent';
            const isImportant = item.category === 'important';

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="group p-4 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : isImportant
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.category}
                    </span>
                    {!item.readByMe && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>

                  <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h2>

                  <p className="text-xs text-muted-foreground truncate">
                    {item.scope} <span className="opacity-40">•</span> {formatRelativeTime(new Date(item.date))}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-muted-foreground group-hover:text-foreground">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Dialog (Click to open full content) */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                    selectedAnnouncement.category === 'urgent'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : selectedAnnouncement.category === 'important'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {selectedAnnouncement.category}
                </span>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedAnnouncement.author} • {selectedAnnouncement.scope}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-sm leading-relaxed text-foreground">
              <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>

              {/* Attachment */}
              {selectedAnnouncement.attachmentName && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {selectedAnnouncement.attachmentName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success(`Downloaded ${selectedAnnouncement.attachmentName}`)}
                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}

              {/* Discussion comments */}
              <div className="pt-3 border-t border-border/60 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Responses
                </h4>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(commentsMap[selectedAnnouncement.id] || []).map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">{c.author}</span>
                        <span className="text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-muted-foreground">{c.text}</p>
                    </div>
                  ))}
                  {(!commentsMap[selectedAnnouncement.id] || commentsMap[selectedAnnouncement.id].length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No comments on this notice yet.</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedAnnouncement.id)}
                    placeholder="Add a reply..."
                    className="flex-1 px-3 py-1.5 bg-muted/40 border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(selectedAnnouncement.id)}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

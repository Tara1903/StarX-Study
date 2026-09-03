"use client";

import { useState, useMemo, useEffect } from 'react';
import { 
  Megaphone, 
  Pin, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  Download, 
  MessageCircle, 
  Send,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    content: 'The official Mid-Term Examination 1 date sheet for B.Tech Semester 1 (ECE & allied branches) has been published by the Controller of Examinations. Exams commence from October 12, 2026. Students must carry their institutional ID cards and arrive at least 15 minutes before the reporting time (08:30 AM). Detailed slot-wise timetable is attached below.',
    category: 'urgent',
    scope: 'IET, SAGE University • B.Tech ECE (Semester 1)',
    author: 'Dr. Exam Controller',
    authorRole: 'Examination Cell, SAGE University',
    date: '2026-09-02T09:30:00Z',
    isPinned: true,
    attachmentName: 'BTech_Sem1_MidTerm1_Schedule_2026.pdf',
    attachmentSize: '1.8 MB',
    commentsCount: 6,
    readByMe: false,
  },
  {
    id: 'ann-2',
    title: 'Mandatory 75% Attendance Requirement Notice',
    content: 'In accordance with University Academic Regulations, a minimum of 75% attendance across all theory and laboratory sessions (Mathematics-I, Chemistry, Basic Electrical, Engineering Graphics, PCES-I, ESDM) is strictly mandatory to be eligible for end-semester examinations. Students with attendance between 60%-74% must submit validated medical/contingency documents to their Academic Mentor.',
    category: 'important',
    scope: 'Faculty of Engineering & Technology (IET)',
    author: 'Prof. Academic Dean',
    authorRole: 'Dean Academic Affairs',
    date: '2026-09-01T11:00:00Z',
    isPinned: true,
    attachmentName: 'Academic_Attendance_Policy_Guidelines.pdf',
    attachmentSize: '950 KB',
    commentsCount: 3,
    readByMe: false,
  },
  {
    id: 'ann-3',
    title: 'Engineering Graphics & Chemistry Laboratory Safety Protocols',
    content: 'All First-Year ECE students attending practical sessions in Room No. 03 / Chemistry Lab-I / Drawing Hall must strictly adhere to campus safety norms. White lab coats and safety goggles are compulsory for Chemistry sessions; mini-drafters and calibrated scales are required for Drawing practicals. Unattended electrical apparatus in BE Lab-I is strictly prohibited.',
    category: 'important',
    scope: 'ECE Department Laboratories',
    author: 'Prof. Garima Pawar & Prof. Vikas Bakshi',
    authorRole: 'Lab Superintendents',
    date: '2026-08-30T14:20:00Z',
    isPinned: false,
    commentsCount: 2,
    readByMe: true,
  },
  {
    id: 'ann-4',
    title: 'Central Library Extended Evening Reading Room Timings',
    content: 'To facilitate study and reference work during the academic term, the Central Engineering Library (Block A) reading hall will remain accessible until 09:30 PM on weekdays and 06:00 PM on Saturdays. Access requires biometrics and valid student smart-card.',
    category: 'general',
    scope: 'Campus Facility • All Students',
    author: 'Chief Librarian',
    authorRole: 'SAGE Central Library',
    date: '2026-08-28T16:00:00Z',
    isPinned: false,
    commentsCount: 1,
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
        } catch {
          // fallback
        }
      }
    }
    return initialData && initialData.length > 0 ? initialData : INITIAL_ANNOUNCEMENTS;
  });

  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>({
    'ann-1': [
      { id: 'c1', author: 'Rahul Verma (ECE-104)', text: 'Is the calculator model FX-991EX permitted in Mathematics-I exam?', time: 'Yesterday at 4:12 PM' },
      { id: 'c2', author: 'Prof. Ruchi Shrivastava [RS]', text: 'Yes, non-programmable scientific calculators are permitted for Unit 1 and Unit 2.', time: 'Yesterday at 5:00 PM' },
    ],
    'ann-2': [
      { id: 'c3', author: 'Ananya Sharma (ECE-112)', text: 'Where can we verify our weekly attendance percentage?', time: '2 days ago' },
    ],
  });

  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studchat_main_announcements', JSON.stringify(announcements));
    }
  }, [announcements]);

  const unreadCount = useMemo(() => {
    return announcements.filter((a) => !a.readByMe).length;
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchesFilter = filter === 'all' || a.category === filter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [announcements, filter, searchQuery]);

  const handleMarkAllRead = () => {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, readByMe: true })));
    toast.success('All main announcements marked as read.');
  };

  const handleToggleRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, readByMe: !a.readByMe } : a))
    );
  };

  const handleToggleComments = (id: string) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (annId: string) => {
    const text = newCommentText[annId]?.trim();
    if (!text) return;

    setCommentsMap((prev) => ({
      ...prev,
      [annId]: [
        ...(prev[annId] || []),
        {
          id: `c_${Date.now()}`,
          author: 'You (Student)',
          text,
          time: 'Just now',
        },
      ],
    }));

    setAnnouncements((prev) =>
      prev.map((a) => (a.id === annId ? { ...a, commentsCount: (a.commentsCount || 0) + 1 } : a))
    );

    setNewCommentText((prev) => ({ ...prev, [annId]: '' }));
    toast.success('Reply submitted to notice board.');
  };

  const getCategoryBadge = (category: 'urgent' | 'important' | 'general') => {
    switch (category) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3 animate-pulse text-red-400" />
            URGENT NOTICE
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Info className="w-3 h-3 text-amber-400" />
            IMPORTANT
          </span>
        );
      case 'general':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Building2 className="w-3 h-3 text-blue-400" />
            ACADEMIC UPDATE
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-background border border-primary/20 rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <Megaphone className="w-4 h-4" />
              <span>Main Academic Communication Space</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Announcements & Campus Notices
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Official institutional broadcasts, examination schedules, and high-priority notices for{' '}
              <span className="text-foreground font-medium">IET, SAGE University • B.Tech ECE (Semester 1)</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {unreadCount > 0 ? (
              <Button
                onClick={handleMarkAllRead}
                variant="outline"
                className="gap-2 text-xs font-semibold border-primary/30 hover:bg-primary/10 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark All as Read ({unreadCount})</span>
              </Button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>All Notices Read</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'urgent', 'important', 'general'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize cursor-pointer ${
                filter === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat === 'all' ? 'All Notices' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-4 py-1.5 bg-muted/60 border border-transparent focus:border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all"
          />
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl bg-card/40 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No announcements found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchQuery ? `No notices match "${searchQuery}".` : 'No announcements currently available in this category.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                item.isPinned
                  ? 'bg-amber-500/[0.03] border-amber-500/30 ring-1 ring-amber-500/20'
                  : item.readByMe
                  ? 'bg-card border-border/70 opacity-90'
                  : 'bg-card border-primary/40 ring-1 ring-primary/20'
              }`}
            >
              {/* Top metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Pin className="w-3 h-3" /> PINNED NOTICE
                    </span>
                  )}
                  {getCategoryBadge(item.category)}
                  {!item.readByMe && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Unread" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                  <button
                    onClick={() => handleToggleRead(item.id)}
                    className="text-[11px] hover:text-primary transition-colors ml-2 cursor-pointer font-medium"
                  >
                    {item.readByMe ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>

              {/* Title & Scope */}
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 leading-snug">
                {item.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span>By <strong className="text-foreground">{item.author}</strong> ({item.authorRole})</span>
                <span>•</span>
                <span className="text-primary font-medium">{item.scope}</span>
              </div>

              {/* Body */}
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed mb-4">
                {item.content}
              </p>

              {/* Attachment if present */}
              {item.attachmentName && (
                <div className="mb-4 inline-flex items-center gap-3 p-3 bg-muted/60 hover:bg-muted rounded-xl border border-border transition-colors group cursor-pointer">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {item.attachmentName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      PDF Document • {item.attachmentSize || '1.2 MB'}
                    </div>
                  </div>
                </div>
              )}

              {/* Discussion Bar */}
              <div className="pt-3 border-t border-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleComments(item.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {(commentsMap[item.id]?.length || 0)} Remark{commentsMap[item.id]?.length === 1 ? '' : 's'} / Discussion
                    </span>
                    {expandedComments[item.id] ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded comments view */}
                {expandedComments[item.id] && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-2 bg-muted/30 p-3 rounded-xl border border-border/60">
                      {(commentsMap[item.id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                          No student remarks yet. Ask a question regarding this notice below.
                        </p>
                      ) : (
                        (commentsMap[item.id] || []).map((c) => (
                          <div key={c.id} className="p-2.5 rounded-lg bg-background/80 border border-border text-xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-foreground">{c.author}</span>
                              <span className="text-[10px] text-muted-foreground">{c.time}</span>
                            </div>
                            <p className="text-foreground/90">{c.text}</p>
                          </div>
                        ))
                      )}

                      {/* Add comment input */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={newCommentText[item.id] || ''}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(item.id);
                            }
                          }}
                          placeholder="Post a question or remark on this notice..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(item.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

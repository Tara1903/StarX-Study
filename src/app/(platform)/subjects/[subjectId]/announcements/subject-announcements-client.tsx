"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageSquare, 
  ChevronRight, 
  X, 
  FileText, 
  Download 
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority?: string;
  created_at: string;
  author?: {
    full_name?: string;
  };
  attachment_name?: string;
}

interface SubjectAnnouncementsClientProps {
  subject: {
    id: string;
    name: string;
    facultyName: string;
  };
  announcements: AnnouncementItem[];
}

export function SubjectAnnouncementsClient({ subject, announcements }: SubjectAnnouncementsClientProps) {
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {subject.name}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            {subject.name} • Updates from {subject.facultyName}
          </p>
        </div>

        <Link
          href={`/chat/${subject.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Go to Chat</span>
        </Link>
      </header>

      {/* Announcements List (Section 30: Title, Author, Time, Priority) */}
      <div className="space-y-2">
        {announcements.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
            No announcements posted for this subject yet.
          </div>
        ) : (
          announcements.map((item) => {
            const isUrgent = item.priority === 'urgent';
            const isImportant = item.priority === 'important';

            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
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
                      {item.priority || 'General'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground truncate">
                    {item.author?.full_name || subject.facultyName} <span className="opacity-40">•</span> {formatRelativeTime(new Date(item.created_at))}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-muted text-muted-foreground inline-block">
                  {selected.priority || 'Notice'}
                </span>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {selected.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selected.author?.full_name || subject.facultyName} • {formatRelativeTime(new Date(selected.created_at))}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm leading-relaxed text-foreground">
              <p className="whitespace-pre-wrap">{selected.content}</p>

              {selected.attachment_name && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {selected.attachment_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success(`Downloaded ${selected.attachment_name}`)}
                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

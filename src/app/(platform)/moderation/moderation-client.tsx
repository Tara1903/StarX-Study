'use client';

import { useState, useMemo } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  AlertTriangle, 
  User, 
  MessageSquare,
  Loader2,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveReport, dismissReport } from '@/actions/admin';
import { formatRelativeTime } from '@/lib/utils';
import type { ReportStatus, ReportCategory } from '@/types/database';

export interface ModerationReportItem {
  id: string;
  category: ReportCategory;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
  reporterName: string;
  reporterEmail?: string;
  reportedUserName?: string;
  reportedUserEmail?: string;
  messageContent?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
}

interface ModerationClientProps {
  universityName: string;
  reports: ModerationReportItem[];
}

export function ModerationClient({ universityName, reports: initialReports }: ModerationClientProps) {
  const [reports, setReports] = useState<ModerationReportItem[]>(initialReports);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution modal state
  const [actionReport, setActionReport] = useState<ModerationReportItem | null>(null);
  const [actionType, setActionType] = useState<'warning' | 'restricted' | 'dismissed'>('warning');
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      let matchesFilter = true;
      if (filter === 'pending') matchesFilter = r.status === 'pending';
      else if (filter === 'resolved') matchesFilter = r.status === 'resolved';
      else if (filter === 'dismissed') matchesFilter = r.status === 'dismissed';

      const matchesSearch =
        !searchQuery.trim() ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.reportedUserName && r.reportedUserName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [reports, filter, searchQuery]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionReport) return;

    try {
      setIsProcessing(true);
      if (actionType === 'dismissed') {
        const res = await dismissReport(actionReport.id, actionNotes.trim() || 'Dismissed by administrator');
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setReports((prev) =>
          prev.map((r) =>
            r.id === actionReport.id
              ? { ...r, status: 'dismissed', resolutionNotes: actionNotes.trim() }
              : r
          )
        );
        toast.success('Report dismissed');
      } else {
        const res = await resolveReport(actionReport.id, actionType, actionNotes.trim() || 'Resolved with enforcement action');
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setReports((prev) =>
          prev.map((r) =>
            r.id === actionReport.id
              ? { ...r, status: 'resolved', resolutionNotes: `[${actionType}] ${actionNotes.trim()}` }
              : r
          )
        );
        toast.success(`Report resolved with ${actionType}`);
      }

      setActionReport(null);
      setActionNotes('');
    } catch {
      toast.error('Failed to update report status');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-white/10 sm:border-border">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Safety & Moderation
          </span>
          <span className="text-xs text-muted-foreground">{universityName}</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Moderation Center
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review reported messages and maintain a safe academic communication environment.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by category, student, or reason..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border shrink-0">
          {(['all', 'pending', 'resolved', 'dismissed'] as const).map((t) => (
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
              {t === 'pending' ? `Pending (${pendingCount})` : t}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">No Moderation Reports</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There are no reported messages or safety violations on file for this institution. The communication environment is healthy.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground bg-card/30 border border-border/60 rounded-2xl">
          No reports match your filter.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-card border border-border/80 hover:border-border transition-all space-y-3.5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Reported by <strong className="text-foreground">{item.reporterName}</strong>
                  </span>
                  {item.reportedUserName && (
                    <span className="text-xs text-muted-foreground">
                      against <strong className="text-foreground">{item.reportedUserName}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      item.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : item.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>

                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(new Date(item.createdAt))}</span>
                  </span>
                </div>
              </div>

              {/* Reported Description */}
              {item.description && (
                <div className="p-3 rounded-xl bg-muted/20 border border-white/5 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reason Given by Reporter
                  </span>
                  <p className="text-xs text-foreground/90">{item.description}</p>
                </div>
              )}

              {/* Reported Message Content (if any) */}
              {item.messageContent && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Flagged Message Snippet
                  </span>
                  <p className="text-xs text-foreground/90 italic">&ldquo;{item.messageContent}&rdquo;</p>
                </div>
              )}

              {/* Resolution Notes (if already resolved) */}
              {item.resolutionNotes && (
                <div className="p-2.5 rounded-xl bg-muted/30 text-xs text-muted-foreground">
                  <strong>Resolution:</strong> {item.resolutionNotes}
                </div>
              )}

              {/* Action Buttons (for pending reports) */}
              {item.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      setActionReport(item);
                      setActionType('dismissed');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionReport(item);
                      setActionType('warning');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
                  >
                    Resolve with Warning
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionReport(item);
                      setActionType('restricted');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                  >
                    Resolve & Enforce
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {actionReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-base font-bold text-foreground">
                {actionType === 'dismissed' ? 'Dismiss Report' : 'Take Moderation Action'}
              </h2>
              <button
                type="button"
                onClick={() => setActionReport(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Report against <strong className="text-foreground">{actionReport.reportedUserName || 'reported user'}</strong> for category <strong className="text-foreground">{actionReport.category}</strong>.
            </p>

            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['warning', 'restricted', 'dismissed'] as const).map((at) => (
                    <button
                      key={at}
                      type="button"
                      onClick={() => setActionType(at)}
                      className={`p-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        actionType === at
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      }`}
                    >
                      {at}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Resolution Notes / Reason</label>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Explain why this action was taken or note reason for record..."
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setActionReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Action</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, MessageSquare, Megaphone, ClipboardList, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('id, user_id, title, body, type, link_url, is_read, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);
            
          if (!error && data) {
            setNotifications(data);
          } else {
            setNotifications([]);
          }
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [supabase]);

  const markAsRead = async (id: string, url?: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    if (url) router.push(url);
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      }
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message_mention':
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-amber-400" />;
      case 'assignment_created':
      case 'assignment_due':
      case 'submission_graded':
      case 'assignment':
        return <ClipboardList className="h-4 w-4 text-blue-400" />;
      default:
        return <Bell className="h-4 w-4 text-foreground" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 sm:border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Academic alerts, course mentions & updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-foreground transition-all cursor-pointer self-start sm:self-auto border border-white/10 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </header>

      {/* Notifications List */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-card/30 border border-border/60 rounded-2xl max-w-md mx-auto space-y-2">
            <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
              <Bell className="w-5 h-5" />
            </div>
            <p className="font-semibold text-foreground text-sm">No Notifications</p>
            <p className="text-xs text-muted-foreground">You don&apos;t have any notifications right now.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id, n.link)}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                n.is_read
                  ? 'bg-card/40 border-border/60 hover:bg-card/70'
                  : 'bg-card border-primary/30 hover:border-primary/50 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {n.body || n.content}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {formatRelativeTime(new Date(n.created_at))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

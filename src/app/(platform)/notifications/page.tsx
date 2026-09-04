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
  const supabase = createClient();
  const router = useRouter();

  const SAMPLE_NOTIFICATIONS = [
    {
      id: 'notif-1',
      title: 'Chemistry',
      content: 'New message from Prof. Garima Pawar in chat',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read_status: false,
      link_url: '/subjects/chemistry/chat',
      type: 'message'
    },
    {
      id: 'notif-2',
      title: 'Institute Notice',
      content: 'Mid-Term 1 Date Sheet published by Examination Cell',
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      read_status: false,
      link_url: '/announcements',
      type: 'announcement'
    },
    {
      id: 'notif-3',
      title: 'Mathematics-I',
      content: 'Problem Set 4 due Friday 5:00 PM',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      read_status: true,
      link_url: '/subjects/math-1',
      type: 'assignment'
    }
  ];

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
            
          if (data && data.length > 0) {
            setNotifications(data);
          } else {
            setNotifications(SAMPLE_NOTIFICATIONS);
          }
        } else {
          setNotifications(SAMPLE_NOTIFICATIONS);
        }
      } catch {
        setNotifications(SAMPLE_NOTIFICATIONS);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [supabase]);

  const markAsRead = async (id: string, url?: string) => {
    try {
      await supabase.from('notifications').update({ read_status: true }).eq('id', id);
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_status: true } : n)));
    if (url) router.push(url);
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('notifications').update({ read_status: true }).eq('user_id', user.id);
      }
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    toast.success('All marked as read');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-amber-400" />;
      case 'assignment':
        return <ClipboardList className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Actionable alerts & updates
          </p>
        </div>

        <button 
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/80 rounded-2xl bg-card/20">
          <Bell className="h-8 w-8 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-foreground">No notifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">You&rsquo;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div 
              key={item.id} 
              onClick={() => markAsRead(item.id, item.link_url)}
              className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-card/80 transition-all flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </span>
                    {!item.read_status && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(item.created_at))}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

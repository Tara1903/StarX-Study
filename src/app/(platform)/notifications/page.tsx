'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, Info, AlertTriangle, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (data) setNotifications(data);
      setLoading(false);
    }
    loadNotifications();
  }, [supabase]);

  const markAsRead = async (id: string, url?: string) => {
    await supabase.from('notifications').update({ read_status: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: true } : n));
    if (url) router.push(url);
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ read_status: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your recent alerts and messages.</p>
        </div>
        <button 
          onClick={markAllRead}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors shadow-sm"
        >
          <Check className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card/50 border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No notifications</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              onClick={() => markAsRead(notification.id, notification.link_url)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                notification.read_status 
                  ? 'bg-card border-border' 
                  : 'bg-primary/5 border-primary/20 shadow-sm'
              }`}
            >
              <div className="p-2 bg-background rounded-full shrink-0 shadow-sm">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1 pt-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`text-sm ${notification.read_status ? 'font-medium text-foreground/80' : 'font-bold text-foreground'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm ${notification.read_status ? 'text-muted-foreground' : 'text-foreground/90 font-medium'}`}>
                  {notification.content}
                </p>
              </div>
              {!notification.read_status && (
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/components/providers/user-provider';
import { markNotificationRead, markAllNotificationsRead } from '@/actions/notifications';
import type { Notification } from '@/types';
import { toast } from 'sonner';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useUser();
  const [supabase] = useState(() => createClient());

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, type, link_url, is_read, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(25);
        
      if (error) throw error;
      setNotifications((data || []) as unknown as Notification[]);
      setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [profile, supabase]);

  useEffect(() => {
    fetchNotifications();

    if (!profile) return;

    const channel = supabase
      .channel(`profile:${profile.id}:notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast('New notification', {
            description: (payload.new as Notification).body || (payload.new as Notification).title
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchNotifications, supabase]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await markNotificationRead(id);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead
  };
}

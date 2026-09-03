"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/components/providers/user-provider';

export function usePresence(subjectId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { profile } = useUser();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel(`subject:${subjectId}:presence`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state).map(key => (state[key][0] as any).user_id);
        setOnlineUsers(Array.from(new Set(users)));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => Array.from(new Set([...prev, (newPresences[0] as any).user_id])));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => prev.filter(id => id !== (leftPresences[0] as any).user_id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId, supabase, profile]);

  return {
    onlineUsers
  };
}

"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/components/providers/user-provider';

export function useTypingIndicator(subjectId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { profile } = useUser();
  const [supabase] = useState(() => createClient());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`subject:${subjectId}:typing`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.payload.user_id !== profile?.id) {
            const userName = payload.payload.user_name;
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.add(userName);
              return newSet;
            });
            
            // Clear after 3 seconds of inactivity
            setTimeout(() => {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userName);
                return newSet;
              });
            }, 3000);
          }
        }
      )
      .subscribe();
      
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [subjectId, supabase, profile?.id]);

  const sendTypingEvent = useCallback(() => {
    if (!profile || !channelRef.current) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: profile.id, user_name: profile.full_name || 'Someone' }
    });
    
    typingTimeoutRef.current = setTimeout(() => {}, 2000); // Debounce visual
  }, [profile]);

  return {
    typingUsers: Array.from(typingUsers),
    sendTypingEvent
  };
}

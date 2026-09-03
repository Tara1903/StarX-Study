"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageWithSender } from '@/types';
import { MESSAGES_PER_PAGE } from '@/lib/constants';
import { toast } from 'sonner';

export function useRealtimeMessages(subjectId: string) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [supabase] = useState(() => createClient());
  const cursorRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setIsLoadingMore(true);
      else setIsLoading(true);

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name, avatar_url),
          reactions:message_reactions(*),
          attachments:message_attachments(*),
          reply_to:messages!messages_reply_to_id_fkey(
            *,
            sender:profiles(id, full_name, avatar_url)
          )
        `)
        .eq('subject_id', subjectId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (isLoadMore && cursorRef.current) {
        query = query.lt('created_at', cursorRef.current);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedData = data as unknown as MessageWithSender[];

      if (formattedData.length > 0) {
        cursorRef.current = formattedData[formattedData.length - 1].created_at;
      }

      setHasMore(formattedData.length === MESSAGES_PER_PAGE);

      setMessages(prev => isLoadMore ? [...prev, ...formattedData] : formattedData);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [subjectId, supabase]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`subject:${subjectId}:messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `subject_id=eq.${subjectId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.status !== 'published') return;
            
            // Fetch the full message with relations
            const { data } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(id, full_name, avatar_url),
                reactions:message_reactions(*),
                attachments:message_attachments(*),
                reply_to:messages!messages_reply_to_id_fkey(
                  *,
                  sender:profiles(id, full_name, avatar_url)
                )
              `)
              .eq('id', payload.new.id)
              .single();
              
            if (data) {
              setMessages(prev => [data as unknown as MessageWithSender, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId, fetchMessages, supabase]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchMessages(true);
    }
  }, [isLoadingMore, hasMore, fetchMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error
  };
}

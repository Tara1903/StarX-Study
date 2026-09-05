"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageWithSender } from '@/types';
import { MESSAGES_PER_PAGE } from '@/lib/constants';
import { getSubjectUuid, isUuid } from '@/lib/subject-resolver';

export function useRealtimeMessages(subjectId: string, subjectUuid?: string) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [supabase] = useState(() => createClient());
  const cursorRef = useRef<string | null>(null);
  const broadcastChannelRef = useRef<any>(null);

  const targetUuid = subjectUuid || (isUuid(subjectId) ? subjectId : getSubjectUuid(subjectId));
  const clearKey = `studchat_cleared_at_${targetUuid || subjectId}`;
  const muteKey = `studchat_muted_${targetUuid || subjectId}`;

  // Check initial mute state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMuted(localStorage.getItem(muteKey) === 'true');
    }
  }, [muteKey]);

  const fetchMessages = useCallback(async (isLoadMore = false) => {
    if (!targetUuid || !isUuid(targetUuid)) {
      setIsLoading(false);
      setIsLoadingMore(false);
      setMessages([]);
      return;
    }

    try {
      if (isLoadMore) setIsLoadingMore(true);
      else setIsLoading(true);

      const clearedAt = typeof window !== 'undefined' ? localStorage.getItem(clearKey) : null;

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name, avatar_url, avatar_type, avatar_preset_id, avatar_emoji),
          reactions:message_reactions(*),
          attachments:message_attachments(*),
          reply_to:messages!messages_reply_to_id_fkey(
            *,
            sender:profiles(id, full_name, avatar_url)
          )
        `)
        .or(`subject_id.eq.${targetUuid},conversation_id.eq.${targetUuid}`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (isLoadMore && cursorRef.current) {
        query = query.lt('created_at', cursorRef.current);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching messages from backend:', fetchError);
        setError(new Error(fetchError.message));
        return;
      }

      let formattedData = (data as unknown as MessageWithSender[]) || [];
      if (clearedAt) {
        formattedData = formattedData.filter((m) => new Date(m.created_at) > new Date(clearedAt));
      }

      if (formattedData.length > 0) {
        // The oldest message in this batch is at the end of descending formattedData
        cursorRef.current = formattedData[formattedData.length - 1].created_at;
      }

      // Convert batch from descending query to chronological order (oldest → newest)
      const chronologicalBatch = [...formattedData].reverse();

      setHasMore(formattedData.length === MESSAGES_PER_PAGE);
      setMessages((prev) => {
        // When loading more older messages, prepend them before current history
        const merged = isLoadMore ? [...chronologicalBatch, ...prev] : chronologicalBatch;
        const seen = new Set<string>();
        return merged.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      });
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [targetUuid, clearKey, supabase]);

  useEffect(() => {
    // Reset state on subject change
    cursorRef.current = null;
    setError(null);
    fetchMessages();

    if (!targetUuid || !isUuid(targetUuid)) return;

    // 1. Supabase Postgres changes filtered to this specific target
    const postgresChannel = supabase
      .channel(`chat_messages:${targetUuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Verify event belongs strictly to this subject or conversation
          const msgSubjectId = (payload.new as any)?.subject_id || (payload.old as any)?.subject_id;
          const msgConvId = (payload.new as any)?.conversation_id || (payload.old as any)?.conversation_id;

          if (msgSubjectId !== targetUuid && msgConvId !== targetUuid) {
            return;
          }

          if (payload.eventType === 'INSERT') {
            if ((payload.new as any).status !== 'published') return;

            const { data } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(id, full_name, avatar_url, avatar_type, avatar_preset_id, avatar_emoji),
                reactions:message_reactions(*),
                attachments:message_attachments(*),
                reply_to:messages!messages_reply_to_id_fkey(
                  *,
                  sender:profiles(id, full_name, avatar_url)
                )
              `)
              .eq('id', (payload.new as any).id)
              .single();

            if (data) {
              const newMsg = data as unknown as MessageWithSender;
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as any;
            if (updatedItem.status === 'deleted') {
              setMessages((prev) => prev.filter((m) => m.id !== updatedItem.id));
            } else {
              setMessages((prev) =>
                prev.map((msg) => (msg.id === updatedItem.id ? { ...msg, ...updatedItem } : msg))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    // 2. Realtime Broadcast Channel scoped strictly to this subject/conversation
    const broadcastChannel = supabase
      .channel(`broadcast:${targetUuid}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload as MessageWithSender];
        });
      })
      .on('broadcast', { event: 'delete_message' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        setMessages((prev) => prev.filter((m) => m.id !== payload.id));
      })
      .subscribe();

    broadcastChannelRef.current = broadcastChannel;

    return () => {
      supabase.removeChannel(postgresChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [targetUuid, supabase, fetchMessages]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchMessages(true);
    }
  }, [isLoadingMore, hasMore, fetchMessages]);

  const appendMessage = useCallback(
    (newMsg: MessageWithSender) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMsg,
        });
      }
    },
    []
  );

  const clearChatOption = useCallback((option: 'chat_only' | 'media_only' | 'everything') => {
    if (option === 'everything') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(clearKey, new Date().toISOString());
      }
      setMessages([]);
    } else if (option === 'chat_only') {
      setMessages((prev) =>
        prev
          .filter((m) => m.attachments && m.attachments.length > 0)
          .map((m) => ({ ...m, content: '📎 [Media File]' }))
      );
    } else if (option === 'media_only') {
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          attachments: [],
        }))
      );
    }
  }, [clearKey]);

  const clearChatForMe = useCallback(() => {
    clearChatOption('everything');
  }, [clearChatOption]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(muteKey, String(next));
      }
      return next;
    });
  }, [muteKey]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    appendMessage,
    clearChatForMe,
    clearChatOption,
    isMuted,
    toggleMute,
  };
}

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

  const targetUuid = subjectUuid || getSubjectUuid(subjectId);
  const storageKey = `studchat_msgs_${subjectId}`;
  const clearKey = `studchat_cleared_at_${subjectId}`;
  const muteKey = `studchat_muted_${subjectId}`;

  // Check initial mute state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMuted(localStorage.getItem(muteKey) === 'true');
    }
  }, [muteKey]);

  // Load cached messages on mount for instant rendering
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const clearedAt = localStorage.getItem(clearKey);
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed: MessageWithSender[] = JSON.parse(cached);
        const filtered = clearedAt
          ? parsed.filter((m) => new Date(m.created_at) > new Date(clearedAt))
          : parsed;
        if (filtered.length > 0) {
          setMessages(filtered);
          setIsLoading(false);
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, [storageKey, clearKey]);

  const saveToLocalCache = useCallback(
    (msgs: MessageWithSender[]) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(msgs.slice(0, 100)));
      } catch {
        // storage quota fallback
      }
    },
    [storageKey]
  );

  const fetchMessages = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setIsLoadingMore(true);
      else setIsLoading(true);

      const clearedAt = typeof window !== 'undefined' ? localStorage.getItem(clearKey) : null;

      // If targetUuid is a valid UUID, query Supabase DB
      if (isUuid(targetUuid)) {
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
          .eq('subject_id', targetUuid)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(MESSAGES_PER_PAGE);

        if (isLoadMore && cursorRef.current) {
          query = query.lt('created_at', cursorRef.current);
        }

        const { data, error: fetchError } = await query;

        if (!fetchError && data) {
          let formattedData = data as unknown as MessageWithSender[];
          if (clearedAt) {
            formattedData = formattedData.filter((m) => new Date(m.created_at) > new Date(clearedAt));
          }

          if (formattedData.length > 0) {
            cursorRef.current = formattedData[formattedData.length - 1].created_at;
          }

          setHasMore(formattedData.length === MESSAGES_PER_PAGE);
          setMessages((prev) => {
            const merged = isLoadMore ? [...prev, ...formattedData] : formattedData;
            // Deduplicate by id
            const seen = new Set<string>();
            const deduped = merged.filter((m) => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return true;
            });
            saveToLocalCache(deduped);
            return deduped;
          });
          return;
        }
      }

      // If DB query didn't return or was skipped, rely on local cache
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed: MessageWithSender[] = JSON.parse(cached);
          const filtered = clearedAt
            ? parsed.filter((m) => new Date(m.created_at) > new Date(clearedAt))
            : parsed;
          setMessages(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [targetUuid, storageKey, clearKey, supabase, saveToLocalCache]);

  useEffect(() => {
    fetchMessages();

    // 1. Supabase Postgres changes (if table exists)
    let postgresChannel: any = null;
    if (isUuid(targetUuid)) {
      postgresChannel = supabase
        .channel(`subject:${subjectId}:messages`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `subject_id=eq.${targetUuid}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              if (payload.new.status !== 'published') return;
              
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
                const newMsg = data as unknown as MessageWithSender;
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  const updated = [newMsg, ...prev];
                  saveToLocalCache(updated);
                  return updated;
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages((prev) => {
                const updated = prev.map((msg) =>
                  msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                );
                saveToLocalCache(updated);
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              setMessages((prev) => {
                const updated = prev.filter((msg) => msg.id !== payload.old.id);
                saveToLocalCache(updated);
                return updated;
              });
            }
          }
        )
        .subscribe();
    }

    // 2. Realtime Broadcast Channel (Scoped strictly to this subject!)
    const broadcastChannel = supabase
      .channel(`subject:${subjectId}:broadcast`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          const updated = [payload as MessageWithSender, ...prev];
          saveToLocalCache(updated);
          return updated;
        });
      })
      .on('broadcast', { event: 'delete_message' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        setMessages((prev) => {
          const updated = prev.filter((m) => m.id !== payload.id);
          saveToLocalCache(updated);
          return updated;
        });
      })
      .subscribe();

    broadcastChannelRef.current = broadcastChannel;

    return () => {
      if (postgresChannel) supabase.removeChannel(postgresChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [subjectId, targetUuid, supabase, fetchMessages, saveToLocalCache]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchMessages(true);
    }
  }, [isLoadingMore, hasMore, fetchMessages]);

  const appendMessage = useCallback(
    (newMsg: MessageWithSender) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const updated = [newMsg, ...prev];
        saveToLocalCache(updated);
        return updated;
      });

      // Broadcast to other tabs/participants in this exact subject channel
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMsg,
        });
      }
    },
    [saveToLocalCache]
  );

  const clearChatForMe = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(clearKey, new Date().toISOString());
      localStorage.removeItem(storageKey);
    }
    setMessages([]);
  }, [clearKey, storageKey]);

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
    isMuted,
    toggleMute,
  };
}

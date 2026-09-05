'use server';

import { createClient } from '@/lib/supabase/server';

export interface StorageMediaItem {
  id: string;
  fileName: string;
  fileType: string;
  category: 'image' | 'pdf' | 'document' | 'other';
  fileSize: number;
  fileSizeFormatted: string;
  storagePath: string;
  publicUrl: string;
  createdAt: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  sourceType: 'friend' | 'studmate';
  sourceTitle: string;
  sourceId: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getCategory(mimeType: string, fileName: string): 'image' | 'pdf' | 'document' | 'other' {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (fileName || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) {
    return 'image';
  }
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    lowerMime.includes('document') ||
    lowerMime.includes('sheet') ||
    lowerMime.includes('presentation') ||
    lowerMime.includes('text') ||
    /\.(docx?|xlsx?|pptx?|txt|csv)$/i.test(lowerName)
  ) {
    return 'document';
  }
  return 'other';
}

/**
 * Retrieves real communication storage items separated into Friends and Studmates categories.
 * No demo data, no fake fallbacks. Real DB attachments from the user's conversations.
 */
export async function getProfileStorageMedia(): Promise<{
  success: boolean;
  friendsMedia: StorageMediaItem[];
  studmatesMedia: StorageMediaItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, friendsMedia: [], studmatesMedia: [], error: 'Not authenticated' };
  }

  try {
    // 1. Get user's active personal conversations (Friends) and subjects (Studmates)
    const [participationsRes, membershipsRes] = await Promise.all([
      supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversation:conversations(id, type)
        `)
        .eq('user_id', user.id),
      supabase
        .from('subject_members')
        .select(`
          subject_id,
          subject:subjects(id, name)
        `)
        .eq('user_id', user.id),
    ]);

    const personalConvIds = (participationsRes.data || [])
      .filter((p: any) => {
        const conv = Array.isArray(p.conversation) ? p.conversation[0] : p.conversation;
        return conv && conv.type === 'personal';
      })
      .map((p) => p.conversation_id);

    const subjectIds = (membershipsRes.data || [])
      .map((m) => m.subject_id)
      .filter(Boolean);

    const subjectMap = new Map<string, string>();
    (membershipsRes.data || []).forEach((m: any) => {
      const s = Array.isArray(m.subject) ? m.subject[0] : m.subject;
      if (s) subjectMap.set(s.id, s.name);
    });

    // 2. Fetch attachments from personal conversations
    let friendsMedia: StorageMediaItem[] = [];
    if (personalConvIds.length > 0) {
      const { data: friendMsgs } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          created_at,
          sender:profiles(id, full_name, avatar_url),
          attachments:message_attachments(
            id,
            file_name,
            file_type,
            file_size,
            storage_path,
            created_at
          )
        `)
        .in('conversation_id', personalConvIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (friendMsgs) {
        for (const msg of friendMsgs) {
          const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
          const senderName = sender?.full_name || 'Friend';
          const senderAvatar = sender?.avatar_url || null;
          const attachments = Array.isArray(msg.attachments) ? msg.attachments : [msg.attachments];

          for (const att of attachments) {
            if (!att || !att.id) continue;
            let publicUrl = att.storage_path;
            if (att.storage_path && !att.storage_path.startsWith('http')) {
              const { data: urlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(att.storage_path);
              publicUrl = urlData?.publicUrl || att.storage_path;
            }

            friendsMedia.push({
              id: att.id,
              fileName: att.file_name,
              fileType: att.file_type,
              category: getCategory(att.file_type, att.file_name),
              fileSize: att.file_size,
              fileSizeFormatted: formatBytes(att.file_size),
              storagePath: att.storage_path,
              publicUrl,
              createdAt: att.created_at || msg.created_at,
              senderName,
              senderAvatarUrl: senderAvatar,
              sourceType: 'friend',
              sourceTitle: senderName,
              sourceId: msg.conversation_id,
            });
          }
        }
      }
    }

    // 3. Fetch attachments from subject / studmate conversations
    let studmatesMedia: StorageMediaItem[] = [];
    if (subjectIds.length > 0) {
      const { data: subjectMsgs } = await supabase
        .from('messages')
        .select(`
          id,
          subject_id,
          created_at,
          sender:profiles(id, full_name, avatar_url),
          attachments:message_attachments(
            id,
            file_name,
            file_type,
            file_size,
            storage_path,
            created_at
          )
        `)
        .in('subject_id', subjectIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (subjectMsgs) {
        for (const msg of subjectMsgs) {
          const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
          const senderName = sender?.full_name || 'Class Member';
          const senderAvatar = sender?.avatar_url || null;
          const subjectTitle = subjectMap.get(msg.subject_id) || 'Subject';
          const attachments = Array.isArray(msg.attachments) ? msg.attachments : [msg.attachments];

          for (const att of attachments) {
            if (!att || !att.id) continue;
            let publicUrl = att.storage_path;
            if (att.storage_path && !att.storage_path.startsWith('http')) {
              const { data: urlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(att.storage_path);
              publicUrl = urlData?.publicUrl || att.storage_path;
            }

            studmatesMedia.push({
              id: att.id,
              fileName: att.file_name,
              fileType: att.file_type,
              category: getCategory(att.file_type, att.file_name),
              fileSize: att.file_size,
              fileSizeFormatted: formatBytes(att.file_size),
              storagePath: att.storage_path,
              publicUrl,
              createdAt: att.created_at || msg.created_at,
              senderName,
              senderAvatarUrl: senderAvatar,
              sourceType: 'studmate',
              sourceTitle: subjectTitle,
              sourceId: msg.subject_id,
            });
          }
        }
      }
    }

    return {
      success: true,
      friendsMedia,
      studmatesMedia,
    };
  } catch (err: any) {
    console.error('Error in getProfileStorageMedia:', err);
    return {
      success: false,
      friendsMedia: [],
      studmatesMedia: [],
      error: err.message,
    };
  }
}

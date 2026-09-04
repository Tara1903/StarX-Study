'use server';

import { createClient } from '@/lib/supabase/server';
import type { ChatConversation } from '@/lib/conversations';
import { formatRelativeTime } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getUserConversations(): Promise<{
  success: boolean;
  data: ChatConversation[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, data: [], error: 'Not authenticated' };
  }

  const result: ChatConversation[] = [];

  try {
    // 1. Fetch Authorized Subject Chats
    const { data: dbMemberships, error: memberError } = await supabase
      .from('subject_members')
      .select(`
        subject_id,
        role,
        subject:subjects!inner(
          id,
          name,
          color,
          icon,
          description,
          semester:semesters(
            name,
            department:departments(name, code)
          ),
          teachers:subject_members(
            role,
            profile:profiles(id, full_name, avatar_url)
          )
        )
      `)
      .eq('user_id', user.id);

    if (!memberError && dbMemberships) {
      for (const sm of (dbMemberships as any[])) {
        const s: any = Array.isArray(sm.subject) ? sm.subject[0] : sm.subject;
        if (!s) continue;
        const teacherMember = Array.isArray(s.teachers)
          ? s.teachers.find((t: any) => t.role === 'teacher')
          : null;
        const facultyName = teacherMember?.profile?.full_name || 'Course Faculty';
        const facultyAbb = facultyName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 3)
          .toUpperCase() || 'CF';

        // Latest message in this subject
        const { data: latestMsgs } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender:profiles(full_name)
          `)
          .eq('subject_id', s.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1);

        const latestMsg = latestMsgs?.[0] as any;
        const lastMessageText = latestMsg?.content || 'Subject room open';
        const senderObj = Array.isArray(latestMsg?.sender) ? latestMsg.sender[0] : latestMsg?.sender;
        const lastSenderName = senderObj?.full_name
          ? senderObj.full_name.split(' ')[0]
          : undefined;
        const lastMsgTime = latestMsg?.created_at
          ? formatRelativeTime(new Date(latestMsg.created_at))
          : undefined;
        const lastActivity = latestMsg?.created_at || s.created_at || new Date().toISOString();

        // Unread count
        const { data: cursor } = await supabase
          .from('message_read_cursors')
          .select('last_read_at')
          .eq('user_id', user.id)
          .eq('subject_id', s.id)
          .maybeSingle();

        let unreadCount = 0;
        if (cursor?.last_read_at) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', s.id)
            .eq('status', 'published')
            .gt('created_at', cursor.last_read_at);
          unreadCount = count || 0;
        } else if (latestMsg) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', s.id)
            .eq('status', 'published');
          unreadCount = count || 0;
        }

        const deptCode = s.semester?.department?.code || 'SUB';

        result.push({
          id: s.id,
          type: 'subject',
          name: s.name,
          subtitle: `${facultyAbb} • ${facultyName}`,
          color: s.color || '#3B82F6',
          avatarType: 'initials',
          lastMessage: lastMessageText,
          lastMessageSender: lastSenderName,
          lastMessageTime: lastMsgTime,
          lastActivityTimestamp: lastActivity,
          unreadCount,
          isPinned: false,
          onlineStatus: 'online',
          facultyName,
          facultyAbb,
          subjectUuid: s.id,
          room: 'Room No. 03',
          code: `${deptCode}-${s.name.substring(0, 3).toUpperCase()}`,
        });
      }
    }

    // 2. Fetch Authorized Personal Conversations
    const { data: myParticipations } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversation:conversations!inner(
          id,
          type,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (myParticipations) {
      for (const p of (myParticipations as any[])) {
        const conv = Array.isArray(p.conversation) ? p.conversation[0] : p.conversation;
        if (!conv || conv.type !== 'personal') continue;

        const convId = p.conversation_id;

        // Query OTHER participant
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            role,
            profile:profiles!inner(
              id,
              full_name,
              avatar_url,
              avatar_type,
              avatar_preset_id,
              avatar_emoji,
              bio
            )
          `)
          .eq('conversation_id', convId)
          .neq('user_id', user.id)
          .limit(1);

        const otherRaw = otherParticipants?.[0]?.profile as any;
        const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw;
        if (!other) continue;

        // Query latest message in this conversation
        const { data: latestMsgs } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender:profiles(full_name)
          `)
          .eq('conversation_id', convId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1);

        const latestMsg = latestMsgs?.[0] as any;
        const lastMessageText = latestMsg?.content || 'Direct conversation started';
        const senderObj = Array.isArray(latestMsg?.sender) ? latestMsg.sender[0] : latestMsg?.sender;
        const lastSenderName = senderObj?.full_name
          ? senderObj.full_name.split(' ')[0]
          : undefined;
        const lastMsgTime = latestMsg?.created_at
          ? formatRelativeTime(new Date(latestMsg.created_at))
          : undefined;
        const lastActivity = latestMsg?.created_at || conv.created_at;

        // Calculate unread count
        let unreadCount = 0;
        if (p.last_read_at) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .eq('status', 'published')
            .gt('created_at', p.last_read_at)
            .neq('sender_id', user.id);
          unreadCount = count || 0;
        }

        result.push({
          id: convId,
          type: 'personal',
          name: other.full_name,
          subtitle: 'Direct Message',
          bio: other.bio || undefined,
          role: (otherParticipants?.[0] as any)?.role || 'student',
          avatarUrl: other.avatar_url,
          avatarType: (other.avatar_type as any) || 'initials',
          avatarPresetId: other.avatar_preset_id,
          avatarEmoji: other.avatar_emoji,
          lastMessage: lastMessageText,
          lastMessageSender: lastSenderName,
          lastMessageTime: lastMsgTime,
          lastActivityTimestamp: lastActivity,
          unreadCount,
          onlineStatus: 'online',
          isPinned: false,
        });
      }
    }

    // Sort: pinned first, then by last activity timestamp descending
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastActivityTimestamp).getTime() - new Date(a.lastActivityTimestamp).getTime();
    });

    return { success: true, data: result };
  } catch (err: any) {
    console.error('Error in getUserConversations:', err);
    return { success: false, data: [], error: err.message };
  }
}

export async function getOrCreatePersonalConversation(targetUserId: string): Promise<{
  success: boolean;
  conversationId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (user.id === targetUserId) {
    return { success: false, error: 'Cannot create conversation with yourself' };
  }

  try {
    // 1. Check if a personal conversation already exists between user.id and targetUserId
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);

      const { data: matchingConv } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversation:conversations!inner(type)
        `)
        .in('conversation_id', convIds)
        .eq('user_id', targetUserId)
        .eq('conversation.type', 'personal')
        .maybeSingle();

      if (matchingConv) {
        return { success: true, conversationId: matchingConv.conversation_id };
      }
    }

    // 2. Create new personal conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        type: 'personal',
      })
      .select('id')
      .single();

    if (createError || !newConv) {
      return { success: false, error: createError?.message || 'Failed to create conversation' };
    }

    // 3. Add both participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: user.id, role: 'member' },
        { conversation_id: newConv.id, user_id: targetUserId, role: 'member' },
      ]);

    if (partError) {
      return { success: false, error: partError.message };
    }

    revalidatePath('/chat');
    return { success: true, conversationId: newConv.id };
  } catch (err: any) {
    console.error('Error in getOrCreatePersonalConversation:', err);
    return { success: false, error: err.message };
  }
}

export async function markConversationRead(conversationIdOrSubjectId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const now = new Date().toISOString();

  // Try updating message_read_cursors for subject
  await supabase
    .from('message_read_cursors')
    .upsert({
      user_id: user.id,
      subject_id: conversationIdOrSubjectId,
      last_read_at: now,
    });

  // Also try updating conversation_participants for personal chat
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: now })
    .eq('conversation_id', conversationIdOrSubjectId)
    .eq('user_id', user.id);
}

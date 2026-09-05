'use server';

import { createClient } from '@/lib/supabase/server';
import type { ChatConversation } from '@/lib/conversations';
import { formatRelativeTime } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { isUuid } from '@/lib/subject-resolver';

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
    // 1. In parallel: Fetch both subject memberships and personal participations in 1 round trip!
    const [dbMembershipsRes, myParticipationsRes] = await Promise.all([
      supabase
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
            created_at,
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
        .eq('user_id', user.id),
      supabase
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
        .eq('user_id', user.id),
    ]);

    const dbMemberships = dbMembershipsRes.data || [];
    const myParticipations = myParticipationsRes.data || [];

    const subjectIds = dbMemberships.map((sm: any) => sm.subject_id).filter(Boolean);
    const personalConvList = myParticipations.filter((p: any) => {
      const conv = Array.isArray(p.conversation) ? p.conversation[0] : p.conversation;
      return conv && conv.type === 'personal';
    });
    const personalConvIds = personalConvList.map((p: any) => p.conversation_id);

    // 2. Batch fetch metadata in parallel for both subjects and personal chats!
    const [
      subjectLatestMsgsRes,
      subjectCursorsRes,
      personalOthersRes,
      personalLatestMsgsRes,
    ] = await Promise.all([
      subjectIds.length > 0
        ? supabase
            .from('messages')
            .select(`
              id,
              subject_id,
              content,
              created_at,
              sender:profiles(full_name)
            `)
            .in('subject_id', subjectIds)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(subjectIds.length * 5)
        : Promise.resolve({ data: [] }),
      subjectIds.length > 0
        ? supabase
            .from('message_read_cursors')
            .select('subject_id, last_read_at')
            .eq('user_id', user.id)
            .in('subject_id', subjectIds)
        : Promise.resolve({ data: [] }),
      personalConvIds.length > 0
        ? supabase
            .from('conversation_participants')
            .select(`
              conversation_id,
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
            .in('conversation_id', personalConvIds)
            .neq('user_id', user.id)
        : Promise.resolve({ data: [] }),
      personalConvIds.length > 0
        ? supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              content,
              created_at,
              sender_id,
              sender:profiles(full_name)
            `)
            .in('conversation_id', personalConvIds)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(personalConvIds.length * 5)
        : Promise.resolve({ data: [] }),
    ]);

    // Build lookup maps
    // A. Subject latest messages & unread counts
    const subjectLatestMap = new Map<string, any>();
    const subjectUnreadCountMap = new Map<string, number>();
    const subjectCursorMap = new Map<string, string>();

    (subjectCursorsRes.data || []).forEach((c: any) => {
      if (c.subject_id && c.last_read_at) {
        subjectCursorMap.set(c.subject_id, c.last_read_at);
      }
    });

    (subjectLatestMsgsRes.data || []).forEach((m: any) => {
      if (!m.subject_id) return;
      if (!subjectLatestMap.has(m.subject_id)) {
        subjectLatestMap.set(m.subject_id, m);
      }
      const lastRead = subjectCursorMap.get(m.subject_id);
      if (lastRead && new Date(m.created_at) > new Date(lastRead)) {
        subjectUnreadCountMap.set(m.subject_id, (subjectUnreadCountMap.get(m.subject_id) || 0) + 1);
      }
    });

    // Process Subject Conversations
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

      const latestMsg = subjectLatestMap.get(s.id);
      const lastMessageText = latestMsg?.content || 'Subject room open';
      const senderObj = Array.isArray(latestMsg?.sender) ? latestMsg.sender[0] : latestMsg?.sender;
      const lastSenderName = senderObj?.full_name
        ? senderObj.full_name.split(' ')[0]
        : undefined;
      const lastMsgTime = latestMsg?.created_at
        ? formatRelativeTime(new Date(latestMsg.created_at))
        : undefined;
      const lastActivity = latestMsg?.created_at || s.created_at || new Date().toISOString();
      const unreadCount = subjectUnreadCountMap.get(s.id) || 0;
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

    // B. Personal latest messages & other participants
    const personalOtherMap = new Map<string, any>();
    (personalOthersRes.data || []).forEach((item: any) => {
      if (item.conversation_id && !personalOtherMap.has(item.conversation_id)) {
        personalOtherMap.set(item.conversation_id, item);
      }
    });

    const personalLatestMap = new Map<string, any>();
    const personalUnreadMap = new Map<string, number>();

    const personalLastReadMap = new Map<string, string | null>();
    personalConvList.forEach((p: any) => {
      personalLastReadMap.set(p.conversation_id, p.last_read_at);
    });

    (personalLatestMsgsRes.data || []).forEach((m: any) => {
      if (!m.conversation_id) return;
      if (!personalLatestMap.has(m.conversation_id)) {
        personalLatestMap.set(m.conversation_id, m);
      }
      const lastRead = personalLastReadMap.get(m.conversation_id);
      if (m.sender_id !== user.id) {
        if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
          personalUnreadMap.set(m.conversation_id, (personalUnreadMap.get(m.conversation_id) || 0) + 1);
        }
      }
    });

    // Process Personal Conversations
    for (const p of personalConvList) {
      const conv = Array.isArray(p.conversation) ? p.conversation[0] : p.conversation;
      const convId = p.conversation_id;
      const otherItem = personalOtherMap.get(convId);
      const otherRaw = otherItem?.profile;
      const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw;
      if (!other) continue;

      const latestMsg = personalLatestMap.get(convId);
      const lastMessageText = latestMsg?.content || 'Direct conversation started';
      const senderObj = Array.isArray(latestMsg?.sender) ? latestMsg.sender[0] : latestMsg?.sender;
      const lastSenderName = senderObj?.full_name
        ? senderObj.full_name.split(' ')[0]
        : undefined;
      const lastMsgTime = latestMsg?.created_at
        ? formatRelativeTime(new Date(latestMsg.created_at))
        : undefined;
      const lastActivity = latestMsg?.created_at || conv?.created_at || new Date().toISOString();
      const unreadCount = personalUnreadMap.get(convId) || 0;

      result.push({
        id: convId,
        type: 'personal',
        name: other.full_name,
        subtitle: 'Direct Message',
        bio: other.bio || undefined,
        role: otherItem?.role || 'student',
        avatarUrl: other.avatar_url,
        avatarType: other.avatar_type || 'initials',
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

  if (!targetUserId || !isUuid(targetUserId)) {
    return { success: false, error: 'Invalid user ID' };
  }

  if (user.id === targetUserId) {
    return { success: false, error: 'Cannot create conversation with yourself' };
  }

  try {
    // Verify target user actually exists
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!targetProfile) {
      return { success: false, error: 'User not found' };
    }

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

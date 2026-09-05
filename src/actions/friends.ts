'use server';

import { createClient } from '@/lib/supabase/server';
import { getOrCreatePersonalConversation } from '@/actions/conversations';
import { revalidatePath } from 'next/cache';

export interface FriendItem {
  id: string; // user profile id
  friendshipId: string;
  fullName: string;
  avatarUrl?: string | null;
  avatarType?: 'uploaded' | 'preset' | 'emoji' | 'initials';
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  bio?: string | null;
  onlineStatus: 'online' | 'offline';
  conversationId?: string;
  addedAt: string;
}

export interface StudmateItem {
  id: string; // student user id
  fullName: string;
  avatarUrl?: string | null;
  avatarType?: 'uploaded' | 'preset' | 'emoji' | 'initials';
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  bio?: string | null;
  academicContext: string;
  sharedSubjects: string[];
  isFriend: boolean;
  conversationId?: string;
}

/**
 * Retrieves the authenticated user's friends list.
 * Friends are stored as direct relationships and resolve to canonical personal chats.
 */
export async function getUserFriends(): Promise<{
  success: boolean;
  data: FriendItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, data: [], error: 'Not authenticated' };
  }

  try {
    // 1. Query user_friends table
    const { data: friendsData, error: friendsError } = await supabase
      .from('user_friends')
      .select(`
        id,
        created_at,
        friend:profiles!friend_id(
          id,
          full_name,
          avatar_url,
          avatar_type,
          avatar_preset_id,
          avatar_emoji,
          bio
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Handle case where user_friends table might be empty or returning
    if (friendsError) {
      console.warn('user_friends query error (table may not exist yet or empty):', friendsError.message);
      return { success: true, data: [] };
    }

    if (!friendsData || friendsData.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Find existing personal conversations for each friend
    const friendUserIds = friendsData.map((f: any) => {
      const p = Array.isArray(f.friend) ? f.friend[0] : f.friend;
      return p?.id;
    }).filter(Boolean);

    const convMap = new Map<string, string>();

    if (friendUserIds.length > 0) {
      // Find my conversations
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvs && myConvs.length > 0) {
        const convIds = myConvs.map((c) => c.conversation_id);
        const { data: friendConvs } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_id,
            conversation:conversations!inner(type)
          `)
          .in('conversation_id', convIds)
          .in('user_id', friendUserIds)
          .eq('conversation.type', 'personal');

        friendConvs?.forEach((fc: any) => {
          convMap.set(fc.user_id, fc.conversation_id);
        });
      }
    }

    const result: FriendItem[] = [];
    for (const item of friendsData) {
      const p = Array.isArray(item.friend) ? item.friend[0] : item.friend;
      if (!p) continue;

      result.push({
        id: p.id,
        friendshipId: item.id,
        fullName: p.full_name || 'Friend',
        avatarUrl: p.avatar_url || null,
        avatarType: p.avatar_type || 'initials',
        avatarPresetId: p.avatar_preset_id || null,
        avatarEmoji: p.avatar_emoji || null,
        bio: p.bio || null,
        onlineStatus: 'online',
        conversationId: convMap.get(p.id),
        addedAt: item.created_at,
      });
    }

    return { success: true, data: result };
  } catch (err: any) {
    console.error('Error in getUserFriends:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Add a friend relationship.
 */
export async function addFriend(friendUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (user.id === friendUserId) {
    return { success: false, error: 'Cannot add yourself as a friend' };
  }

  try {
    // Check if already friends
    const { data: existing } = await supabase
      .from('user_friends')
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', friendUserId)
      .maybeSingle();

    if (existing) {
      return { success: true };
    }

    const { error: insertError } = await supabase
      .from('user_friends')
      .insert({
        user_id: user.id,
        friend_id: friendUserId,
      });

    if (insertError) {
      console.warn('Error inserting into user_friends:', insertError.message);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/chat');
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    console.error('Error in addFriend:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a friend relationship.
 */
export async function removeFriend(friendUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('user_friends')
      .delete()
      .eq('user_id', user.id)
      .eq('friend_id', friendUserId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/chat');
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Retrieves Studmates: fellow students from the user's academic context (enrolled subjects).
 * Searches ONLY within the user's cohort of studmates when searchQuery is supplied.
 */
export async function getAcademicStudmates(searchQuery?: string): Promise<{
  success: boolean;
  data: StudmateItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, data: [], error: 'Not authenticated' };
  }

  try {
    // 1. Get current user's enrolled subjects
    const { data: myMemberships } = await supabase
      .from('subject_members')
      .select('subject_id, subject:subjects(id, name, semester:semesters(name, department:departments(name, code)))')
      .eq('user_id', user.id);

    if (!myMemberships || myMemberships.length === 0) {
      return { success: true, data: [] };
    }

    const mySubjectIds = myMemberships.map((m) => m.subject_id).filter(Boolean);
    const subjectNameMap = new Map<string, string>();
    myMemberships.forEach((m: any) => {
      const s = Array.isArray(m.subject) ? m.subject[0] : m.subject;
      if (s) subjectNameMap.set(s.id, s.name);
    });

    // 2. Fetch fellow student members enrolled in ANY of these same subjects
    const { data: peerMembers, error: peerError } = await supabase
      .from('subject_members')
      .select(`
        subject_id,
        user_id,
        role,
        profile:profiles(
          id,
          full_name,
          avatar_url,
          avatar_type,
          avatar_preset_id,
          avatar_emoji,
          bio
        )
      `)
      .in('subject_id', mySubjectIds)
      .neq('user_id', user.id)
      .eq('role', 'student');

    if (peerError) {
      console.error('Error fetching peer members:', peerError.message);
      return { success: false, data: [], error: peerError.message };
    }

    if (!peerMembers || peerMembers.length === 0) {
      return { success: true, data: [] };
    }

    // 3. In parallel: Fetch user's friends list and existing conversation IDs
    const [friendsRes, myConvsRes] = await Promise.all([
      supabase
        .from('user_friends')
        .select('friend_id')
        .eq('user_id', user.id),
      supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id),
    ]);

    const friendIdSet = new Set((friendsRes.data || []).map((f) => f.friend_id));

    // Aggregate peers by user_id
    const studmatesMap = new Map<string, {
      profile: any;
      sharedSubjectIds: Set<string>;
    }>();

    for (const m of peerMembers) {
      const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      if (!p || !p.id) continue;

      if (!studmatesMap.has(p.id)) {
        studmatesMap.set(p.id, {
          profile: p,
          sharedSubjectIds: new Set([m.subject_id]),
        });
      } else {
        studmatesMap.get(p.id)!.sharedSubjectIds.add(m.subject_id);
      }
    }

    const peerUserIds = Array.from(studmatesMap.keys());
    const convMap = new Map<string, string>();

    if (peerUserIds.length > 0 && myConvsRes.data && myConvsRes.data.length > 0) {
      const myConvIds = myConvsRes.data.map((c) => c.conversation_id);
      const { data: matchedConvs } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          conversation:conversations!inner(type)
        `)
        .in('conversation_id', myConvIds)
        .in('user_id', peerUserIds)
        .eq('conversation.type', 'personal');

      matchedConvs?.forEach((mc: any) => {
        convMap.set(mc.user_id, mc.conversation_id);
      });
    }

    // Build final StudmateItem list
    let result: StudmateItem[] = [];

    studmatesMap.forEach((entry, peerId) => {
      const p = entry.profile;
      const sharedNames = Array.from(entry.sharedSubjectIds)
        .map((sid) => subjectNameMap.get(sid))
        .filter(Boolean) as string[];

      result.push({
        id: peerId,
        fullName: p.full_name || 'Studmate',
        avatarUrl: p.avatar_url,
        avatarType: p.avatar_type || 'initials',
        avatarPresetId: p.avatar_preset_id,
        avatarEmoji: p.avatar_emoji,
        bio: p.bio,
        academicContext: sharedNames.slice(0, 2).join(', ') + (sharedNames.length > 2 ? ` +${sharedNames.length - 2} more` : ''),
        sharedSubjects: sharedNames,
        isFriend: friendIdSet.has(peerId),
        conversationId: convMap.get(peerId),
      });
    });

    // Filter by searchQuery if supplied (strictly within studmates dataset!)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.academicContext.toLowerCase().includes(q) ||
          s.sharedSubjects.some((subj) => subj.toLowerCase().includes(q))
      );
    }

    // Sort by name
    result.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return { success: true, data: result };
  } catch (err: any) {
    console.error('Error in getAcademicStudmates:', err);
    return { success: false, data: [], error: err.message };
  }
}

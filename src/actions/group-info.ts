'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { resolveSubject, isUuid } from '@/lib/subject-resolver';
import type { GroupInfoData, GroupMember, SharedMediaItem } from '@/lib/group-info-data';

const updateGroupSchema = z.object({
  conversationId: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
});

export async function getRealGroupInfo(targetId: string): Promise<GroupInfoData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Check if targetId is a subject
  const subject = await resolveSubject(targetId, supabase);
  if (subject) {
    // Verify membership or institute_head access
    const { data: membership } = await supabase
      .from('subject_members')
      .select('id, role')
      .eq('subject_id', subject.uuid)
      .eq('user_id', user.id)
      .maybeSingle();

    let isAuthorized = !!membership;
    if (!isAuthorized && subject.universityId) {
      const { data: headMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.universityId)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();
      if (headMember) isAuthorized = true;
    }

    if (!isAuthorized) return null;

    // Fetch members
    const { data: dbMembers } = await supabase
      .from('subject_members')
      .select(`
        user_id,
        role,
        joined_at,
        profile:profiles(
          id,
          full_name,
          avatar_url,
          avatar_type,
          avatar_preset_id,
          avatar_emoji,
          display_name,
          bio
        )
      `)
      .eq('subject_id', subject.uuid)
      .order('joined_at', { ascending: true });

    const members: GroupMember[] = (dbMembers || []).map((m: any) => {
      const prof = m.profile;
      return {
        id: m.user_id,
        name: prof?.full_name || 'Member',
        email: '',
        role: m.role as 'teacher' | 'student',
        isAdmin: m.role === 'teacher',
        subtitle: m.role === 'teacher' ? 'Faculty' : 'Student',
        bio: prof?.bio || undefined,
        avatarUrl: prof?.avatar_url,
        avatarType: prof?.avatar_type || (m.role === 'teacher' ? 'preset' : 'initials'),
        avatarPresetId: prof?.avatar_preset_id,
        avatarEmoji: prof?.avatar_emoji,
        joinedAt: m.joined_at || new Date().toISOString(),
      };
    });

    const teacherCount = members.filter((m) => m.role === 'teacher').length;

    // Fetch real media / attachments belonging strictly to this subject
    const { data: attachments } = await supabase
      .from('message_attachments')
      .select(`
        id,
        file_name,
        file_type,
        file_size,
        storage_path,
        created_at,
        message:messages!inner(
          id,
          subject_id,
          sender:profiles(full_name)
        )
      `)
      .eq('message.subject_id', subject.uuid)
      .order('created_at', { ascending: false })
      .limit(50);

    const media: SharedMediaItem[] = (attachments || []).map((att: any) => ({
      id: att.id,
      conversationId: targetId,
      type: att.file_type?.startsWith('image/') ? 'image' : 'document',
      url: att.storage_path || '',
      name: att.file_name,
      size: `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`,
      sharedBy: att.message?.sender?.full_name || 'Member',
      sharedAt: new Date(att.created_at).toLocaleDateString(),
    }));

    // Fetch pinned messages
    const { data: pinned } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender:profiles(full_name)
      `)
      .eq('subject_id', subject.uuid)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false });

    const pinnedMessages = (pinned || []).map((p: any) => ({
      id: p.id,
      content: p.content,
      senderName: p.sender?.full_name || 'Member',
      pinnedAt: new Date(p.created_at).toLocaleDateString(),
    }));

    return {
      id: subject.id,
      type: 'subject',
      name: subject.name,
      description: subject.description || '',
      avatarType: 'initials',
      color: subject.color,
      facultyAbb: subject.facultyAbb,
      room: subject.room,
      code: subject.code,
      memberCount: members.length,
      teacherCount,
      members,
      media,
      pinnedMessages,
    };
  }

  // 2. Check if targetId is a personal conversation (UUID)
  if (isUuid(targetId)) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, type, created_at')
      .eq('id', targetId)
      .maybeSingle();

    if (conv && conv.type === 'personal') {
      // Check user is participant
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id, role')
        .eq('conversation_id', targetId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!participant) return null;

      // Fetch participants
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          role,
          joined_at,
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
        .eq('conversation_id', targetId);

      const members: GroupMember[] = (allParticipants || []).map((p: any) => {
        const prof = p.profile;
        return {
          id: p.user_id,
          name: prof?.full_name || 'Member',
          email: '',
          role: p.role === 'teacher' ? 'teacher' : 'student',
          isAdmin: p.role === 'teacher',
          subtitle: p.role === 'teacher' ? 'Faculty' : 'Student',
          bio: prof?.bio || undefined,
          avatarUrl: prof?.avatar_url,
          avatarType: prof?.avatar_type || 'preset',
          avatarPresetId: prof?.avatar_preset_id,
          avatarEmoji: prof?.avatar_emoji,
          joinedAt: p.joined_at || new Date().toISOString(),
        };
      });

      const rawOther = allParticipants?.find((p: any) => p.user_id !== user.id)?.profile;
      const otherParticipant: any = Array.isArray(rawOther) ? rawOther[0] : rawOther;

      // Fetch attachments
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select(`
          id,
          file_name,
          file_type,
          file_size,
          storage_path,
          created_at,
          message:messages!inner(
            id,
            conversation_id,
            sender:profiles(full_name)
          )
        `)
        .eq('message.conversation_id', targetId)
        .order('created_at', { ascending: false })
        .limit(50);

      const media: SharedMediaItem[] = (attachments || []).map((att: any) => ({
        id: att.id,
        conversationId: targetId,
        type: att.file_type?.startsWith('image/') ? 'image' : 'document',
        url: att.storage_path || '',
        name: att.file_name,
        size: `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`,
        sharedBy: att.message?.sender?.full_name || 'Member',
        sharedAt: new Date(att.created_at).toLocaleDateString(),
      }));

      // Fetch pinned messages
      const { data: pinned } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:profiles(full_name)
        `)
        .eq('conversation_id', targetId)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false });

      const pinnedMessages = (pinned || []).map((p: any) => ({
        id: p.id,
        content: p.content,
        senderName: p.sender?.full_name || 'Member',
        pinnedAt: new Date(p.created_at).toLocaleDateString(),
      }));

      return {
        id: targetId,
        type: 'personal',
        name: otherParticipant?.full_name || 'Personal Chat',
        description: otherParticipant?.bio || 'Direct personal conversation',
        avatarUrl: otherParticipant?.avatar_url,
        avatarType: otherParticipant?.avatar_type || 'preset',
        avatarPresetId: otherParticipant?.avatar_preset_id,
        avatarEmoji: otherParticipant?.avatar_emoji,
        memberCount: members.length,
        teacherCount: members.filter((m) => m.role === 'teacher').length,
        members,
        media,
        pinnedMessages,
      };
    }
  }

  return null;
}

export async function getRealEligibleUsersToAdd(targetId: string, currentMemberIds: string[]): Promise<GroupMember[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Find user's university
  const { data: membership } = await supabase
    .from('university_memberships')
    .select('university_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return [];

  // Query university peers not in currentMemberIds
  const { data: peers } = await supabase
    .from('university_memberships')
    .select(`
      user_id,
      role,
      joined_at,
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
    .eq('university_id', membership.university_id);

  if (!peers) return [];

  return peers
    .filter((p: any) => !currentMemberIds.includes(p.user_id))
    .map((p: any) => {
      const prof = p.profile;
      return {
        id: p.user_id,
        name: prof?.full_name || 'Student',
        email: '',
        role: p.role === 'teacher' ? 'teacher' : 'student',
        isAdmin: p.role === 'teacher',
        subtitle: p.role === 'teacher' ? 'Faculty Member' : 'Student',
        bio: prof?.bio || undefined,
        avatarUrl: prof?.avatar_url,
        avatarType: prof?.avatar_type || 'preset',
        avatarPresetId: prof?.avatar_preset_id,
        avatarEmoji: prof?.avatar_emoji,
        joinedAt: p.joined_at || new Date().toISOString(),
      };
    });
}

export async function updateGroupDetails(input: z.infer<typeof updateGroupSchema>) {
  const parsed = updateGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input format' };
  }

  const { conversationId, name, description } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Sanitize description
  const cleanDescription = description?.trim().replace(/<[^>]*>?/gm, '');

  const subject = await resolveSubject(conversationId, supabase);
  if (subject) {
    const { data: member } = await supabase
      .from('subject_members')
      .select('role')
      .eq('subject_id', subject.uuid)
      .eq('user_id', user.id)
      .maybeSingle();

    let isAuthorized = member?.role === 'teacher';
    if (!isAuthorized && subject.universityId) {
      const { data: headMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.universityId)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();
      if (headMember) isAuthorized = true;
    }

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized: Only faculty and institute heads can modify group details.' };
    }

    const updateData: Record<string, any> = {};
    if (cleanDescription !== undefined) updateData.description = cleanDescription;
    if (name?.trim()) updateData.name = name.trim();

    const { error: updateError } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', subject.uuid);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath(`/subjects/${subject.id}/chat`);
    revalidatePath(`/chat/${subject.id}`);
    return {
      success: true,
      data: {
        conversationId,
        name: name?.trim(),
        description: cleanDescription,
      },
    };
  }

  return { success: false, error: 'Subject not found' };
}

export async function addGroupMemberAction(conversationId: string, memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const subject = await resolveSubject(conversationId, supabase);
  if (subject) {
    const { data: member } = await supabase
      .from('subject_members')
      .select('role')
      .eq('subject_id', subject.uuid)
      .eq('user_id', user.id)
      .maybeSingle();

    let isAuthorized = member?.role === 'teacher';
    if (!isAuthorized && subject.universityId) {
      const { data: headMember } = await supabase
        .from('university_memberships')
        .select('role')
        .eq('university_id', subject.universityId)
        .eq('user_id', user.id)
        .eq('role', 'institute_head')
        .maybeSingle();
      if (headMember) isAuthorized = true;
    }

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized: Only faculty and institute heads can add participants.' };
    }

    const { error: insertError } = await supabase
      .from('subject_members')
      .insert({
        subject_id: subject.uuid,
        user_id: memberId,
        role: 'student',
      });

    if (insertError) return { success: false, error: insertError.message };

    revalidatePath(`/subjects/${subject.id}/chat`);
    revalidatePath(`/chat/${subject.id}`);
    return { success: true, memberId };
  }

  return { success: false, error: 'Subject not found' };
}

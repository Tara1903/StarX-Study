'use server';

import { createClient } from '@/lib/supabase/server';
import { moderateMessage, calculateEscalation, calculateStrikeDecay, isRestrictionExpired } from '@/lib/moderation/engine';
import { sendMessageSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import { resolveSubject, isUuid } from '@/lib/subject-resolver';

export async function sendMessage(data: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const parsed = sendMessageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid message data' };
  }

  const { subject_id, conversation_id, content, reply_to_id } = parsed.data;

  let targetSubjectId: string | null = null;
  let targetConversationId: string | null = null;
  let universityId: string | null = null;

  // 1. Resolve conversation / subject and verify authorization
  if (conversation_id && isUuid(conversation_id)) {
    // Verify user is a participant of this conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id, conversation:conversations(id, type, subject_id)')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      // Check if it's a subject conversation where user is a subject member
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, type, subject_id')
        .eq('id', conversation_id)
        .single();

      if (conv && conv.subject_id) {
        const { data: subMember } = await supabase
          .from('subject_members')
          .select('id')
          .eq('subject_id', conv.subject_id)
          .eq('user_id', user.id)
          .single();

        if (!subMember) {
          return { success: false, error: 'Unauthorized: You are not a member of this conversation' };
        }
        targetConversationId = conv.id;
        targetSubjectId = conv.subject_id;
      } else {
        return { success: false, error: 'Unauthorized: You are not a participant of this conversation' };
      }
    } else {
      targetConversationId = conversation_id;
      const conv = participant.conversation as any;
      if (conv?.subject_id) {
        targetSubjectId = conv.subject_id;
      }
    }
  } else if (subject_id) {
    // Resolve subject
    const resolved = await resolveSubject(subject_id, supabase);
    if (!resolved || !isUuid(resolved.uuid)) {
      return { success: false, error: 'Subject not found' };
    }
    targetSubjectId = resolved.uuid;

    // Verify user membership in subject
    const { data: subMember } = await supabase
      .from('subject_members')
      .select('id')
      .eq('subject_id', targetSubjectId)
      .eq('user_id', user.id)
      .single();

    if (!subMember) {
      return { success: false, error: 'Unauthorized: You are not enrolled in this subject' };
    }

    // Check if canonical conversation exists for this subject
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('subject_id', targetSubjectId)
      .maybeSingle();

    if (conv) {
      targetConversationId = conv.id;
    }
  }

  if (!targetSubjectId && !targetConversationId) {
    return { success: false, error: 'Invalid destination for message' };
  }

  // 2. Resolve university for moderation
  if (targetSubjectId) {
    const { data: subj } = await supabase
      .from('subjects')
      .select('university_id')
      .eq('id', targetSubjectId)
      .single();
    if (subj) universityId = subj.university_id;
  }

  if (!universityId) {
    const { data: userUni } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (userUni) universityId = userUni.university_id;
  }

  // Check moderation profile
  let strikes = 0;
  if (universityId && isUuid(universityId)) {
    const { data: modProfile } = await supabase
      .from('moderation_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('university_id', universityId)
      .maybeSingle();

    if (modProfile) {
      if (modProfile.status === 'suspended') {
        return { success: false, error: 'Your account is currently suspended from sending messages.' };
      }
      if (modProfile.status === 'restricted' && !isRestrictionExpired(modProfile.restriction_expires_at)) {
        return { success: false, error: 'Your account is currently restricted from messaging.' };
      }
      if (modProfile.status === 'slow_mode' && modProfile.last_message_at) {
        const msDiff = new Date().getTime() - new Date(modProfile.last_message_at).getTime();
        if (msDiff < 30000) return { success: false, error: 'Slow mode active. Please wait 30 seconds between messages.' };
      }
      strikes = calculateStrikeDecay(modProfile.active_strikes, modProfile.last_violation_at);
    }
  }

  // 3. Validate reply-to message belongs to the same context (Requirement 22)
  if (reply_to_id) {
    const { data: targetReplyMsg } = await supabase
      .from('messages')
      .select('id, subject_id, conversation_id')
      .eq('id', reply_to_id)
      .maybeSingle();

    if (!targetReplyMsg) {
      return { success: false, error: 'The message you are replying to no longer exists' };
    }

    const matchesSubject = targetSubjectId && targetReplyMsg.subject_id === targetSubjectId;
    const matchesConversation = targetConversationId && targetReplyMsg.conversation_id === targetConversationId;

    if (!matchesSubject && !matchesConversation) {
      return { success: false, error: 'Reply target does not belong to this conversation' };
    }
  }

  // 4. Content moderation
  const decision = await moderateMessage(content);

  if (decision.decision === 'block') {
    const { newStatus, newStrikes, restrictionExpiresAt } = calculateEscalation(strikes, decision.severity || 'medium');
    
    if (universityId && isUuid(universityId)) {
      await supabase.from('moderation_profiles').upsert({
        user_id: user.id,
        university_id: universityId,
        active_strikes: newStrikes,
        last_violation_at: new Date().toISOString(),
        status: newStatus,
        restriction_expires_at: restrictionExpiresAt
      });

      await supabase.from('moderation_logs').insert({
        user_id: user.id,
        university_id: universityId,
        message_content: content,
        action: 'block',
        reason: decision.reason
      });
    }

    return { success: false, error: 'Message blocked by automated moderation. Please keep content respectful and academic.', moderated: true };
  }

  const messageStatus = decision.decision === 'flag' ? 'pending_review' : 'published';

  // 5. Insert directly into database
  const insertPayload: Record<string, any> = {
    sender_id: user.id,
    content: content.trim(),
    reply_to_id: reply_to_id || null,
    status: messageStatus,
  };

  if (targetSubjectId) {
    insertPayload.subject_id = targetSubjectId;
  }
  if (targetConversationId) {
    insertPayload.conversation_id = targetConversationId;
  }

  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert(insertPayload)
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
    .single();

  if (insertError || !message) {
    return { success: false, error: insertError?.message || 'Failed to save message to database' };
  }

  // Update conversation timestamp if conversation_id exists
  if (targetConversationId) {
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', targetConversationId);
  }

  // Revalidate relevant paths
  if (subject_id) {
    revalidatePath(`/subjects/${subject_id}/chat`);
    revalidatePath(`/subjects/${subject_id}`);
  }
  if (targetConversationId) {
    revalidatePath(`/chat/${targetConversationId}`);
  }
  revalidatePath('/chat');

  return { success: true, data: message };
}

export async function editMessage(messageId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: message } = await supabase
    .from('messages')
    .select('sender_id, subject_id, conversation_id, status')
    .eq('id', messageId)
    .single();

  if (!message || message.sender_id !== user.id) return { success: false, error: 'Unauthorized to edit this message' };
  if (message.status === 'deleted') return { success: false, error: 'Cannot edit a deleted message' };

  const decision = await moderateMessage(content);
  if (decision.decision === 'block') {
    return { success: false, error: 'Edit blocked by automated moderation' };
  }

  const status = decision.decision === 'flag' ? 'pending_review' : 'published';

  const { data: updated, error } = await supabase
    .from('messages')
    .update({ 
      content: content.trim(), 
      status, 
      is_edited: true, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', messageId)
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url, avatar_type, avatar_preset_id, avatar_emoji),
      reactions:message_reactions(*),
      attachments:message_attachments(*)
    `)
    .single();

  if (error) return { success: false, error: error.message };

  if (message.subject_id) {
    revalidatePath(`/subjects/${message.subject_id}/chat`);
  }
  if (message.conversation_id) {
    revalidatePath(`/chat/${message.conversation_id}`);
  }

  return { success: true, data: updated };
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: message } = await supabase
    .from('messages')
    .select('sender_id, subject_id, conversation_id')
    .eq('id', messageId)
    .single();

  if (!message) return { success: false, error: 'Message not found' };

  let isAuthorized = message.sender_id === user.id;

  if (!isAuthorized && message.subject_id) {
    const { data: member } = await supabase
      .from('subject_members')
      .select('role')
      .eq('subject_id', message.subject_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (member && member.role === 'teacher') isAuthorized = true;
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized to delete this message' };

  const { error } = await supabase
    .from('messages')
    .update({ status: 'deleted', content: '' })
    .eq('id', messageId);

  if (error) return { success: false, error: error.message };

  if (message.subject_id) {
    revalidatePath(`/subjects/${message.subject_id}/chat`);
  }
  if (message.conversation_id) {
    revalidatePath(`/chat/${message.conversation_id}`);
  }

  return { success: true };
}

export async function pinMessage(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: message } = await supabase
    .from('messages')
    .select('subject_id, conversation_id, is_pinned')
    .eq('id', messageId)
    .single();

  if (!message) return { success: false, error: 'Message not found' };

  let isAuthorized = false;

  if (message.subject_id) {
    const { data: member } = await supabase
      .from('subject_members')
      .select('role')
      .eq('subject_id', message.subject_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (member && member.role === 'teacher') {
      isAuthorized = true;
    } else {
      const { data: subject } = await supabase
        .from('subjects')
        .select('university_id')
        .eq('id', message.subject_id)
        .maybeSingle();

      if (subject) {
        const { data: uniMember } = await supabase
          .from('university_memberships')
          .select('role')
          .eq('university_id', subject.university_id)
          .eq('user_id', user.id)
          .eq('role', 'institute_head')
          .maybeSingle();

        if (uniMember) isAuthorized = true;
      }
    }
  } else if (message.conversation_id) {
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (participant) isAuthorized = true;
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized to pin messages here' };

  const newPinned = !message.is_pinned;
  const { error } = await supabase
    .from('messages')
    .update({ is_pinned: newPinned })
    .eq('id', messageId);

  if (error) return { success: false, error: error.message };

  if (message.subject_id) {
    revalidatePath(`/subjects/${message.subject_id}/chat`);
  }
  if (message.conversation_id) {
    revalidatePath(`/chat/${message.conversation_id}`);
  }

  return { success: true, is_pinned: newPinned };
}

export const togglePinMessage = pinMessage;

export async function toggleReaction(messageId: string, emoji: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: user.id, emoji });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateReadCursor(destinationId: string, messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if destinationId is a subject
  const resolved = await resolveSubject(destinationId, supabase);
  if (resolved) {
    const { error } = await supabase.from('message_read_cursors').upsert({
      subject_id: resolved.uuid,
      user_id: user.id,
      last_read_message_id: messageId,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Otherwise check if it's a conversation_id
  if (isUuid(destinationId)) {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', destinationId)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  return { success: false, error: 'Invalid destination ID' };
}


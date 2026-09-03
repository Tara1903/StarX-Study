'use server';

import { createClient } from '@/lib/supabase/server';
import { moderateMessage, calculateEscalation, calculateStrikeDecay, isRestrictionExpired } from '@/lib/moderation/engine';
import { sendMessageSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function sendMessage(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const parsed = sendMessageSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };
  const { subject_id, content, reply_to_id } = parsed.data;

  // 1. Check membership and get university_id
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('university_id, id')
    .eq('id', subject_id)
    .single();

  if (subjectError || !subject) return { success: false, error: 'Subject not found' };
  const universityId = subject.university_id;

  const { data: membership, error: membershipError } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', subject_id)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) return { success: false, error: 'Not a member of this subject' };

  // 2. Check Moderation Status
  const { data: modProfile } = await supabase
    .from('moderation_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('university_id', universityId)
    .single();

  let strikes = 0;
  if (modProfile) {
    if (modProfile.status === 'suspended') {
      return { success: false, error: 'Account suspended' };
    }
    if (modProfile.status === 'restricted' && !isRestrictionExpired(modProfile.restriction_expires_at)) {
      return { success: false, error: 'Account currently restricted' };
    }
    if (modProfile.status === 'slow_mode' && modProfile.last_message_at) {
      const msDiff = new Date().getTime() - new Date(modProfile.last_message_at).getTime();
      if (msDiff < 30000) return { success: false, error: 'Slow mode active. Please wait.' };
    }
    strikes = calculateStrikeDecay(modProfile.active_strikes, modProfile.last_violation_at);
  }

  // 3. Moderate Message
  const decision = await moderateMessage(content);

  if (decision.decision === 'block') {
    const { newStatus, newStrikes, restrictionExpiresAt } = calculateEscalation(strikes, decision.severity || 'medium');
    
    // update moderation_profiles
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

    return { success: false, error: 'Message not sent. This content may violate community guidelines.', moderated: true };
  }

  const messageStatus = decision.decision === 'flag' ? 'pending_review' : 'published';

  const { data: message, error } = await supabase.from('messages').insert({
    subject_id,
    sender_id: user.id,
    content,
    reply_to_id: reply_to_id || null,
    status: messageStatus
  }).select().single();

  if (error) return { success: false, error: error.message };

  // Update last message at
  await supabase.from('moderation_profiles').upsert({
    user_id: user.id,
    university_id: universityId,
    last_message_at: new Date().toISOString()
  });

  if (decision.decision === 'flag') {
    await supabase.from('moderation_logs').insert({
      user_id: user.id,
      university_id: universityId,
      message_id: message.id,
      message_content: content,
      action: 'flag',
      reason: decision.reason
    });
  }

  revalidatePath(`/subjects/${subject_id}`);
  return { success: true, data: message };
}

export async function editMessage(messageId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: message } = await supabase.from('messages').select('sender_id, subject_id, status').eq('id', messageId).single();
  if (!message || message.sender_id !== user.id) return { success: false, error: 'Unauthorized' };
  
  if (message.status === 'deleted') return { success: false, error: 'Message is deleted' };

  const decision = await moderateMessage(content);
  if (decision.decision === 'block') {
    return { success: false, error: 'Edit blocked by moderation' };
  }

  const status = decision.decision === 'flag' ? 'pending_review' : 'published';

  const { data: updated, error } = await supabase.from('messages').update({ content, status, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .select().single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/subjects/${message.subject_id}`);
  return { success: true, data: updated };
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: message } = await supabase.from('messages').select('sender_id, subject_id').eq('id', messageId).single();
  if (!message) return { success: false, error: 'Not found' };

  let isAuthorized = message.sender_id === user.id;

  if (!isAuthorized) {
    const { data: member } = await supabase.from('subject_members')
      .select('role')
      .eq('subject_id', message.subject_id)
      .eq('user_id', user.id)
      .single();
    if (member && member.role === 'teacher') isAuthorized = true;
  }

  if (!isAuthorized) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('messages').update({ status: 'deleted', content: '' }).eq('id', messageId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/subjects/${message.subject_id}`);
  return { success: true };
}

export async function pinMessage(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: message } = await supabase.from('messages').select('subject_id, is_pinned').eq('id', messageId).single();
  if (!message) return { success: false, error: 'Not found' };

  const { data: member } = await supabase.from('subject_members')
    .select('role')
    .eq('subject_id', message.subject_id)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'teacher') return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('messages').update({ is_pinned: !message.is_pinned }).eq('id', messageId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/subjects/${message.subject_id}`);
  return { success: true };
}

export async function toggleReaction(messageId: string, emoji: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: existing } = await supabase.from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateReadCursor(subject_id: string, messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('message_read_cursors').upsert({
    subject_id,
    user_id: user.id,
    last_read_message_id: messageId
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

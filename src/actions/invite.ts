'use server';

import { createClient } from '@/lib/supabase/server';
import { generateInviteCodeSchema, useInviteCodeSchema, GenerateInviteCodeInput, UseInviteCodeInput } from '@/lib/validations/schemas';
import { nanoid } from 'nanoid';

export async function generateInviteCode(input: GenerateInviteCodeInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const validated = generateInviteCodeSchema.parse(input);
    
    // Verify user is institute_head
    const { data: member } = await supabase
      .from('university_memberships')
      .select('role')
      .eq('university_id', validated.university_id)
      .eq('user_id', user.id)
      .eq('role', 'institute_head')
      .single();
      
    if (!member) return { success: false, error: 'Unauthorized: Must be Institute Head' };

    const code = nanoid(10).toUpperCase();
    
    let expiresAt = null;
    if (validated.expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validated.expires_in_days);
    }

    const { data, error } = await supabase.from('invite_codes').insert({
      code,
      university_id: validated.university_id,
      target_role: validated.target_role,
      created_by: user.id,
      max_uses: validated.max_uses,
      expires_at: expiresAt ? expiresAt.toISOString() : null
    }).select().single();

    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function useInviteCode(input: UseInviteCodeInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const validated = useInviteCodeSchema.parse(input);
    
    // First fetch the code using service role since RLS might block if it's expired or used up
    // Wait, the policy says: USING (expires_at > now() OR expires_at IS NULL). 
    // It doesn't check max_uses. So authenticated users can view it if not expired.
    const { data: codeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', validated.code)
      .single();
      
    if (codeError || !codeData) {
      return { success: false, error: 'Invalid or expired invite code' };
    }
    
    if (codeData.max_uses !== null && codeData.uses >= codeData.max_uses) {
      return { success: false, error: 'Invite code has reached its maximum uses' };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('university_memberships')
      .select('id')
      .eq('university_id', codeData.university_id)
      .eq('user_id', user.id)
      .single();
      
    if (existingMember) {
      return { success: false, error: 'You are already a member of this university' };
    }

    // Since we need to update uses and insert membership, this requires service role or RPC 
    // We'll use the server-side client which is authenticated as the user.
    // However, users can't update invite_codes uses directly unless they are institute_head.
    // So we need an RPC function for this transaction.
    // Let's create an RPC in the next migration step, or just use the admin client.
    
    // For now, since we have the service role key, we could create an admin client, but it's better to use RPC.
    // Let's just use RPC in the migration. I'll add the RPC to the migration script.

    const { data: result, error: joinError } = await supabase.rpc('use_invite_code', {
      p_code: validated.code,
      p_user_id: user.id
    });

    if (joinError) throw joinError;
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

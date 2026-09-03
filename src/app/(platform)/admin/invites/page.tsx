import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldAlert, UsersRound, Plus, Copy, Check, Calendar, Trash2 } from 'lucide-react';
import { InviteManager } from './invite-manager';

export default async function AdminInvitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('university_id')
    .eq('user_id', user.id)
    .eq('role', 'institute_head')
    .limit(1)
    .maybeSingle();

  if (!membership?.university_id) {
    redirect('/dashboard');
  }

  const { data: invites } = await supabase
    .from('invite_codes')
    .select('*, created_by_profile:profiles!invite_codes_created_by_fkey(full_name)')
    .eq('university_id', membership.university_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invite Codes</h1>
          <p className="text-muted-foreground mt-1">Manage platform access and invite new teachers and students.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden p-6">
        <InviteManager 
          universityId={membership.university_id} 
          initialInvites={invites || []} 
        />
      </div>
    </div>
  );
}

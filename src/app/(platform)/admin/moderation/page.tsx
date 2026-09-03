import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('university_id')
    .eq('user_id', user?.id)
    .eq('role', 'institute_head')
    .limit(1)
    .maybeSingle();

  let moderationProfiles: any[] = [];
  let moderationLogs: any[] = [];
  
  if (membership?.university_id) {
    // Fetch profiles that have strikes or restrictions
    const { data: profilesData } = await supabase
      .from('moderation_profiles')
      .select(`
        user_id,
        status,
        active_strikes,
        restriction_expires_at,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .gt('active_strikes', 0)
      .order('active_strikes', { ascending: false });
    
    moderationProfiles = profilesData || [];

    // Fetch recent logs
    const { data: logsData } = await supabase
      .from('moderation_logs')
      .select(`
        id,
        action,
        reason,
        created_at,
        profiles!moderation_logs_user_id_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
      
    moderationLogs = logsData || [];
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
          <p className="text-muted-foreground mt-1">Manage user conduct, restrictions, and reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Users under moderation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="text-lg font-semibold text-foreground flex items-center">
                <AlertTriangle className="h-5 w-5 text-warning mr-2" />
                Users Requiring Attention
              </h2>
            </div>
            
            <div className="divide-y divide-border">
              {moderationProfiles.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-foreground">All Clear</h3>
                  <p className="text-muted-foreground mt-1">No users currently have strikes or restrictions.</p>
                </div>
              ) : (
                moderationProfiles.map((modProfile) => (
                  <div key={modProfile.user_id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-muted relative overflow-hidden flex-shrink-0">
                        {modProfile.profiles?.avatar_url ? (
                          <Image src={modProfile.profiles.avatar_url} alt="Avatar" fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            {modProfile.profiles?.full_name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-foreground">
                          {modProfile.profiles?.full_name || 'Unknown User'}
                        </h4>
                        <div className="flex items-center mt-1 space-x-3 text-sm">
                          <span className="flex items-center text-warning font-medium">
                            <ShieldAlert className="h-4 w-4 mr-1" />
                            {modProfile.active_strikes} Strikes
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            modProfile.status === 'restricted' || modProfile.status === 'suspended'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-muted text-foreground'
                          }`}>
                            {modProfile.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-muted transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Recent Logs */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            </div>
            
            <div className="p-0">
              {moderationLogs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No recent moderation activity.
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {moderationLogs.map((log) => (
                    <li key={log.id} className="p-4 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-foreground">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        Target: {log.profiles?.full_name || 'Unknown User'}
                      </p>
                      {log.reason && (
                        <p className="text-muted-foreground text-xs mt-1 italic">
                          "{log.reason}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

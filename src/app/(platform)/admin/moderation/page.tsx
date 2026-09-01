import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('school_memberships')
    .select('school_id')
    .eq('user_id', user?.id)
    .in('role', ['teacher_admin', 'student_admin'])
    .limit(1)
    .maybeSingle();

  let moderationProfiles: any[] = [];
  let moderationLogs: any[] = [];
  
  if (membership?.school_id) {
    // Fetch profiles that have strikes or restrictions
    const { data: profilesData } = await supabase
      .from('moderation_profiles')
      .select(`
        id,
        user_id,
        status,
        strikes_count,
        restriction_expires_at,
        profiles (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .gt('strikes_count', 0)
      .order('strikes_count', { ascending: false });
    
    moderationProfiles = profilesData || [];

    // Fetch recent logs
    const { data: logsData } = await supabase
      .from('moderation_logs')
      .select(`
        id,
        action,
        reason,
        created_at,
        profiles (
          first_name,
          last_name
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Moderation</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage user conduct, restrictions, and reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Users under moderation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Users Requiring Attention
              </h2>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {moderationProfiles.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">All Clear</h3>
                  <p className="text-slate-500 mt-1">No users currently have strikes or restrictions.</p>
                </div>
              ) : (
                moderationProfiles.map((modProfile) => (
                  <div key={modProfile.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden flex-shrink-0">
                        {modProfile.profiles?.avatar_url ? (
                          <Image src={modProfile.profiles.avatar_url} alt="Avatar" fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-500">
                            {modProfile.profiles?.first_name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {modProfile.profiles?.first_name} {modProfile.profiles?.last_name}
                        </h4>
                        <div className="flex items-center mt-1 space-x-3 text-sm">
                          <span className="flex items-center text-amber-600 dark:text-amber-500 font-medium">
                            <ShieldAlert className="h-4 w-4 mr-1" />
                            {modProfile.strikes_count} Strikes
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            modProfile.status === 'restricted' || modProfile.status === 'banned'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {modProfile.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
            </div>
            
            <div className="p-0">
              {moderationLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No recent moderation activity.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {moderationLogs.map((log) => (
                    <li key={log.id} className="p-4 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                        Target: {log.profiles?.first_name} {log.profiles?.last_name}
                      </p>
                      {log.reason && (
                        <p className="text-slate-400 text-xs mt-1 italic">
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

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, Moon, Sun, LogOut, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
        setUser(profile || user);
      }
      setLoading(false);
    }
    loadUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-primary/80" />
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 sm:-mt-16 mb-6">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user?.full_name || user?.email?.split('@')[0] || 'User'}</h2>
              <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Shield className="h-4 w-4" />
                <span className="capitalize font-medium">{user?.system_role || 'Member'}</span>
              </p>
            </div>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors border shadow-sm w-full sm:w-auto">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Contact Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                    <p className="font-medium">{user?.phone_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Security & Preferences</h3>
              <div className="flex flex-col gap-2">
                <button className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left text-sm font-medium">
                  Change Password
                </button>
                <button className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Sun className="h-4 w-4" /> Theme
                  </span>
                  <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded">System</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t flex justify-end">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

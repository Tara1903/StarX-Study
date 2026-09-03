import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_status, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_status === 'completed') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to studchat</h1>
          <p className="text-muted-foreground mt-2">
            Hi {profile?.full_name}, let's get you set up.
          </p>
        </div>
        
        <OnboardingClient userId={user.id} />
      </div>
    </div>
  );
}

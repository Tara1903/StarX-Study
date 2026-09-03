'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInviteCode } from '@/actions/invite';
import { Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function OnboardingClient({ userId }: { userId: string }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCreateUniversity = async () => {
    // We will redirect to a page to create a university
    router.push('/onboarding/create-university');
  };

  const handleJoinUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await useInviteCode({ code: code.trim() });
      if (res.success) {
        // Update onboarding_status
        await supabase
          .from('profiles')
          .update({ onboarding_status: 'completed' })
          .eq('id', userId);
          
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(res.error || 'Invalid invite code');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleJoinUniversity} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Have an invite code?
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code here"
            className="w-full h-11 bg-background border border-input rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full h-11 bg-primary hover:bg-[#12CFEA] text-primary-foreground rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join University'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3 text-center">
          Are you an administrator setting up a new institution?
        </p>
        <button
          onClick={handleCreateUniversity}
          disabled={loading}
          className="w-full h-11 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-border"
        >
          <span>Create a University</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

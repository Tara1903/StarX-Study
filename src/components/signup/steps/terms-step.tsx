import { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';
import { createClient } from '@/lib/supabase/client';

interface TermsStepProps {
  data: SignupState;
  onNext: (data?: Partial<SignupState>) => void;
  onPrev: () => void;
}

export function TermsStep({ data, onNext, onPrev }: TermsStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const supabase = createClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email!,
        password: data.password!,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            full_name: data.fullName,
            role: data.role,
          },
        },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (authError.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
          throw new Error('Too many attempts right now. Please wait a moment and try again.');
        }
        throw new Error(authError.message);
      }

      // In Supabase, if an email already exists and email confirmation is enabled,
      // identities array is empty rather than returning an error to prevent user enumeration.
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }

      onNext();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPrev} disabled={isSubmitting} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors disabled:opacity-50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">Terms & Privacy</h2>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <p>
            By creating an account, you agree to StarX Study&apos;s Terms of Service and Privacy Policy.
            We ensure that your academic data is securely protected and only shared with your affiliated institution.
          </p>
        </div>
        
        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background/50 cursor-pointer hover:bg-background transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-border bg-card text-primary focus:ring-primary/50"
          />
          <span className="text-white font-medium">I agree to the Terms of Service and Privacy Policy</span>
        </label>

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      <button
        type="button"
        disabled={!agreed || isSubmitting}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#22C55E] transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </div>
  );
}

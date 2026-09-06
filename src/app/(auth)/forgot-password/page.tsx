'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const validatedData = forgotPasswordSchema.parse({ email });
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        validatedData.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (resetError.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
          throw new Error('Too many attempts right now. Please wait a moment and try again.');
        }
        throw new Error(resetError.message);
      }

      setIsSuccess(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Validation error');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <Mail className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="mt-2 text-[#A8B2C2]">
            If an account exists for <span className="font-medium text-white">{email}</span>, we&apos;ve sent a password reset link to your inbox.
          </p>
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#22C55E] transition-colors"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center sm:text-left">
        <Link 
          href="/login" 
          className="inline-flex items-center text-sm font-medium text-primary hover:text-[#34D399] mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className={`block w-full h-11 rounded-lg border bg-[#0E1A12] text-white ${
                error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-[#193022] focus:border-primary focus:ring-primary/20'
              } pl-10 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#22C55E] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            'Reset password'
          )}
        </button>
      </form>
    </div>
  );
}

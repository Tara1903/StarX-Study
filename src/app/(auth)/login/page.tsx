'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, Fingerprint, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GitHubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white text-center py-12">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || ROUTES?.DASHBOARD || '/dashboard';
  const urlError = searchParams.get('error');
  const isVerified = searchParams.get('verified') === 'true';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; root?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const supabase = createClient();
  const isAnyLoading = isLoading || isPasskeyLoading || isOAuthLoading !== null;

  useEffect(() => {
    // Check if WebAuthn / Passkeys are supported by the browser
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setIsPasskeySupported(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof typeof errors] || errors.root) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined, root: undefined }));
    }
    if (unconfirmedEmail) setUnconfirmedEmail(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setUnconfirmedEmail(null);

    try {
      const validatedData = loginSchema.parse(formData);

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (error.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
          throw new Error('Too many attempts right now. Please wait a moment and try again.');
        } else if (msg.includes('email not confirmed')) {
          setUnconfirmedEmail(validatedData.email);
          throw new Error('Please verify your email address before signing in.');
        } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else {
          throw new Error(error.message);
        }
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (error as any).errors.forEach((err: any) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        setErrors({ root: error instanceof Error ? error.message : 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsOAuthLoading(provider);
    setErrors({});

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback${
        redirectTo && redirectTo !== '/dashboard'
          ? `?next=${encodeURIComponent(redirectTo)}`
          : ''
      }`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setIsOAuthLoading(null);
        const friendlyName = provider === 'google' ? 'Google' : 'GitHub';
        setErrors({
          root: `${friendlyName} sign-in couldn't be completed. Please try again.`,
        });
      }
    } catch (err: any) {
      setIsOAuthLoading(null);
      const friendlyName = provider === 'google' ? 'Google' : 'GitHub';
      setErrors({
        root: `${friendlyName} sign-in couldn't be completed. Please try again.`,
      });
    }
  };

  const handlePasskeyLogin = async () => {
    if (!isPasskeySupported) {
      setErrors({ root: "Passkeys aren't supported in this browser. Try another sign-in method." });
      return;
    }

    setIsPasskeyLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) {
        if (
          error.name === 'NotAllowedError' ||
          error.message?.toLowerCase().includes('cancel') ||
          error.message?.toLowerCase().includes('abort')
        ) {
          setErrors({ root: 'Passkey authentication was cancelled.' });
          return;
        }

        if (
          error.message?.toLowerCase().includes('no credentials') ||
          error.message?.toLowerCase().includes('not found')
        ) {
          setErrors({
            root: 'No passkey found on this device for StarX Study. Please sign in with email and password, then register a passkey in Security settings.',
          });
          return;
        }

        setErrors({
          root: "Couldn't sign in with your passkey. Try again or use email and password.",
        });
        return;
      }

      if (data?.session) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setErrors({ root: 'Passkey authentication was cancelled.' });
      } else {
        setErrors({
          root: err?.message || "Couldn't sign in with your passkey. Try again or use email and password.",
        });
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-7 w-full">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-1.5 text-sm text-[#A8B2C2]">
          Please sign in to your account to continue
        </p>
      </div>

      {isVerified && (
        <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20 flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Your email has been verified! You can now sign in.</span>
        </div>
      )}

      {urlError && !errors.root && (
        <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-400 border border-amber-500/20 flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{urlError}</span>
        </div>
      )}

      {errors.root && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 space-y-2">
          <p>{errors.root}</p>
          {unconfirmedEmail && (
            <Link
              href={`/verify-email?email=${encodeURIComponent(unconfirmedEmail)}`}
              className="inline-block text-xs font-semibold text-primary hover:underline"
            >
              Resend verification email &rarr;
            </Link>
          )}
        </div>
      )}

      {/* 1. Primary Email + Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
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
                value={formData.email}
                onChange={handleChange}
                disabled={isAnyLoading}
                className={`block w-full h-11 rounded-lg border bg-[#0E1A12] text-white ${
                  errors.email
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-[#193022] focus:border-primary focus:ring-primary/20'
                } pl-10 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:text-[#34D399] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isAnyLoading}
                className={`block w-full h-11 rounded-lg border bg-[#0E1A12] text-white ${
                  errors.password
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-[#193022] focus:border-primary focus:ring-primary/20'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isAnyLoading}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-primary hover:bg-[#22C55E] active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            'Log in'
          )}
        </button>
      </form>

      {/* ──────── OR ──────── */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#193022]" />
        </div>
        <span className="relative bg-[#050805] px-3 text-xs uppercase text-muted-foreground font-medium">
          or
        </span>
      </div>

      {/* 2. Alternative Auth Hierarchy: Google, GitHub, Passkey */}
      <div className="space-y-2.5">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={isAnyLoading}
          className="flex w-full items-center justify-center gap-3 h-11 rounded-lg border border-[#193022] bg-[#0E1A12] px-4 py-2 text-sm font-medium text-white hover:bg-[#193022] hover:border-primary/40 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer shadow-sm"
        >
          {isOAuthLoading === 'google' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Redirecting to Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* GitHub OAuth Button */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('github')}
          disabled={isAnyLoading}
          className="flex w-full items-center justify-center gap-3 h-11 rounded-lg border border-[#193022] bg-[#0E1A12] px-4 py-2 text-sm font-medium text-white hover:bg-[#193022] hover:border-primary/40 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer shadow-sm"
        >
          {isOAuthLoading === 'github' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Redirecting to GitHub...</span>
            </>
          ) : (
            <>
              <GitHubIcon className="h-4 w-4 shrink-0 text-white fill-current" />
              <span>Continue with GitHub</span>
            </>
          )}
        </button>

        {/* Passkey Button */}
        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={isAnyLoading}
          className="flex w-full items-center justify-center gap-3 h-11 rounded-lg border border-[#193022] bg-[#0E1A12] px-4 py-2 text-sm font-medium text-white hover:bg-[#193022] hover:border-primary/40 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer shadow-sm"
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Verifying passkey...</span>
            </>
          ) : (
            <>
              <Fingerprint className="h-5 w-5 text-primary shrink-0" />
              <span>Continue with passkey</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-1">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-[#34D399] transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound, Fingerprint, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

import { Suspense } from "react";
export default function LoginPage() { return <Suspense fallback={<div className="text-white text-center">Loading...</div>}><LoginContent /></Suspense>; }

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
  const [showPassword, setShowPassword] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const supabase = createClient();

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
        if (msg.includes('email not confirmed')) {
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

  const handlePasskeyLogin = async () => {
    setIsPasskeyLoading(true);
    setErrors({});

    try {
      if (!isPasskeySupported) {
        throw new Error('Passkeys are not supported on this browser or device.');
      }

      // Supabase signInWithPasskey performs the complete WebAuthn ceremony
      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) {
        // Handle common WebAuthn user cancellation or device rejection
        if (
          error.name === 'NotAllowedError' ||
          error.message?.toLowerCase().includes('cancel') ||
          error.message?.toLowerCase().includes('abort')
        ) {
          setErrors({ root: 'Passkey sign-in was cancelled.' });
          return;
        }

        if (error.message?.toLowerCase().includes('no credentials') || error.message?.toLowerCase().includes('not found')) {
          setErrors({ root: 'No passkey found on this device for studchat. Please sign in with email and password, then register a passkey in Security settings.' });
          return;
        }

        setErrors({ root: "Couldn't sign in with your passkey. Try again or use email and password." });
        return;
      }

      if (data?.session) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setErrors({ root: 'Passkey sign-in was cancelled.' });
      } else {
        setErrors({ root: err?.message || "Couldn't sign in with your passkey. Try again or use email and password." });
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-[#A8B2C2]">
          Please sign in to your account to continue
        </p>
      </div>

      {isVerified && (
        <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Your email has been verified! You can now sign in.</span>
        </div>
      )}

      {urlError && !errors.root && (
        <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-400 border border-amber-500/20 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{urlError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.root && (
          <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 space-y-2">
            <p>{errors.root}</p>
            {unconfirmedEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(unconfirmedEmail)}`}
                className="inline-block text-xs font-semibold text-[#168BFF] hover:underline"
              >
                Resend verification email &rarr;
              </Link>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading || isPasskeyLoading}
                className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                  errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
                } pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#F5F7FB]" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#168BFF] hover:text-[#12CFEA] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading || isPasskeyLoading}
                className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                  errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6F7B8E] hover:text-[#A8B2C2] transition-colors"
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
          disabled={isLoading || isPasskeyLoading}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/50 focus:ring-offset-2 focus:ring-offset-[#050B16] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            'Log in'
          )}
        </button>

        {/* Passkey Alternative */}
        {isPasskeySupported && (
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#050B16] px-3 text-xs uppercase text-[#6F7B8E] font-medium">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={isLoading || isPasskeyLoading}
              className="flex w-full items-center justify-center gap-2 h-11 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#168BFF]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {isPasskeyLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-[#168BFF]" />
                  <span>Verifying passkey...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5 text-[#12CFEA]" />
                  <span>Continue with passkey</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      <div className="text-center text-sm text-[#A8B2C2]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[#168BFF] hover:text-[#12CFEA] transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  );
}


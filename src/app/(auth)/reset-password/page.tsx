'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; root?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsSessionValid(false);
      } else {
        setIsSessionValid(true);
      }
    }
    checkSession();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof typeof errors] || errors.root) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined, root: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = resetSchema.parse(formData);

      const { error } = await supabase.auth.updateUser({
        password: validatedData.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
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

  if (isSessionValid === false) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Invalid or expired link</h2>
          <p className="mt-2 text-sm text-[#A8B2C2]">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="flex w-full items-center justify-center h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#22C55E] transition-colors"
        >
          Request a new reset email
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-[#A7B3AA] hover:text-white transition-colors"
        >
          Back to login
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Password updated</h2>
          <p className="mt-2 text-sm text-[#A7B3AA]">
            Your password has been successfully updated. You can now use your new password to sign in.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#22C55E] transition-colors shadow-sm"
        >
          Continue to StarX Study
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-[#A7B3AA]">
          Choose a new, secure password for your StarX Study account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.root && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            {errors.root}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full h-11 rounded-lg border bg-card text-white ${
                  errors.password
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-border focus:border-primary focus:ring-primary/20'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7F5]" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full h-11 rounded-lg border bg-card text-white ${
                  errors.confirmPassword
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-border focus:border-primary focus:ring-primary/20'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#22C55E] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm font-semibold"
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Reset password'}
        </button>
      </form>
    </div>
  );
}

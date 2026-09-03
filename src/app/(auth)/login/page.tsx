'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

import { Suspense } from "react";
export default function LoginPage() { return <Suspense fallback={<div>Loading...</div>}><LoginContent /></Suspense>; }
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || ROUTES?.DASHBOARD || '/dashboard';
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; root?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof typeof errors] || errors.root) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined, root: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = loginSchema.parse(formData);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        throw new Error(error.message);
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

  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-[#A8B2C2]">
          Please sign in to your account to continue
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
                disabled={isLoading}
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
                disabled={isLoading}
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
          disabled={isLoading}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/50 focus:ring-offset-2 focus:ring-offset-[#050B16] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            'Sign in'
          )}
        </button>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#050B16] px-2 text-[11px] text-[#6F7B8E] uppercase tracking-wider">or preview</span>
          <div className="border-t border-white/10 w-full" />
        </div>

        <button
          type="button"
          onClick={() => {
            document.cookie = "studchat_demo=true; path=/; max-age=86400";
            window.location.href = redirectTo || '/dashboard';
          }}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 hover:border-primary/50 transition-all shadow-sm cursor-pointer gap-2"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Explore Demo Student App</span>
        </button>
      </form>

      <div className="text-center text-sm text-[#A8B2C2]">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-[#168BFF] hover:text-[#12CFEA] transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  );
}

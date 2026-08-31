// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    // Clear error when user types
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
        error.errors.forEach(err => {
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Please sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.root && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {errors.root}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full h-11 rounded-lg border ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } pl-10 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full h-11 rounded-lg border ${
                  errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
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
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Sign up
        </Link>
      </div>
    </div>
  );
}


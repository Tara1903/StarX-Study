// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [K in keyof typeof formData]?: string } & { root?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      const validatedData = registerSchema.parse(formData);
      
      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.fullName,
          }
        }
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

  if (isSuccess) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <Mail className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="mt-2 text-[#A8B2C2]">
            We&apos;ve sent a confirmation link to <span className="font-medium text-white">{formData.email}</span>.
            Please click the link to activate your account.
          </p>
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] transition-colors"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create an account</h1>
        <p className="mt-2 text-sm text-[#A8B2C2]">
          Join studchat to start your learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.root && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            {errors.root}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]" htmlFor="fullName">
              Full Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                  errors.fullName ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
                } pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
                placeholder="John Doe"
              />
            </div>
            {errors.fullName && <p className="text-sm text-red-400">{errors.fullName}</p>}
          </div>

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
                } pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]" htmlFor="password">
              Password
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
                className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                  errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6F7B8E] hover:text-[#A8B2C2]"
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#F5F7FB]" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-[#6F7B8E]" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                  errors.confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
                } pl-10 pr-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
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
            'Create account'
          )}
        </button>
      </form>

      <div className="text-center text-sm text-[#A8B2C2]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#168BFF] hover:text-[#12CFEA]">
          Sign in
        </Link>
      </div>
    </div>
  );
}

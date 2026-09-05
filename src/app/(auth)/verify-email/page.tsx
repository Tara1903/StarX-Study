'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Edit3, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [newEmailInput, setNewEmailInput] = useState(initialEmail);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    const targetEmail = email || newEmailInput;
    if (!targetEmail) {
      setMessage({ type: 'error', text: 'Please provide a valid email address.' });
      return;
    }

    setIsResending(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (error.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
          throw new Error('Too many attempts right now. Please wait a moment and try again.');
        }
        throw new Error(error.message);
      }

      setMessage({
        type: 'success',
        text: `Verification email resent to ${targetEmail}. Please check your inbox.`,
      });
      setCooldown(30);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Verification email could not be sent. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setEmail(newEmailInput);
    setIsEditingEmail(false);
    setMessage(null);
  };

  return (
    <div className="flex flex-col space-y-6 text-center">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#168BFF]/10 border border-[#168BFF]/20 shadow-lg">
        <Mail className="h-8 w-8 text-[#168BFF]" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Check your email</h1>
        <p className="text-sm text-[#A8B2C2] max-w-sm mx-auto">
          We&apos;ve sent a verification link to your email address. Verify your email to continue using studchat.
        </p>
      </div>

      {/* Target Email Card */}
      <div className="p-4 rounded-xl border border-white/10 bg-[#111D31] text-sm text-center">
        {isEditingEmail ? (
          <form onSubmit={handleSaveEmail} className="space-y-3">
            <label className="text-xs text-[#A8B2C2] block text-left font-medium">Enter your email address</label>
            <input
              type="email"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg bg-[#050B16] border border-white/10 text-white text-sm focus:outline-none focus:border-[#168BFF]"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#168BFF] text-white text-xs font-semibold hover:bg-[#12CFEA] transition-colors"
              >
                Save
              </button>
              {email && (
                <button
                  type="button"
                  onClick={() => {
                    setNewEmailInput(email);
                    setIsEditingEmail(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-white/5 text-white text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="text-left overflow-hidden">
              <p className="text-xs text-[#6F7B8E]">Verification sent to</p>
              <p className="font-semibold text-white truncate text-sm">{email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewEmailInput(email);
                setIsEditingEmail(true);
              }}
              className="inline-flex items-center gap-1 text-xs text-[#168BFF] hover:text-[#12CFEA] px-2 py-1 rounded hover:bg-white/5 transition-colors shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Change
            </button>
          </div>
        )}
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center gap-2 text-left ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0 || !email}
          className="flex w-full items-center justify-center h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend verification email
            </>
          )}
        </button>

        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-11 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium text-[#A8B2C2] hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
      </div>

      <p className="text-xs text-[#6F7B8E]">
        Didn&apos;t receive an email? Check your spam folder or click resend above.
      </p>
    </div>
  );
}

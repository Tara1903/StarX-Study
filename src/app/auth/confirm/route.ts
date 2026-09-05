import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Handle errors sent from Supabase redirect
  if (error || error_description) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set(
      'error',
      error_description || error || 'Authentication verification failed. Please try again.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();

  // 1. Verify OTP with token_hash (standard Supabase email verification / recovery link)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!verifyError) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.search = '';
      if (type === 'signup' || type === 'email') {
        redirectUrl.searchParams.set('verified', 'true');
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. PKCE code exchange
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. Invalid or expired token fallback
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = type === 'recovery' ? '/forgot-password' : '/login';
  redirectUrl.search = '';
  redirectUrl.searchParams.set(
    'error',
    type === 'recovery'
      ? 'This password reset link is invalid or has expired. Please request a new one.'
      : 'Verification link invalid or expired. Please request a new verification email.'
  );
  return NextResponse.redirect(redirectUrl);
}

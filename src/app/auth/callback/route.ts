import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getSafeDestination(next: string | null): string {
  if (!next) return '/dashboard';
  // Strictly ensure relative path to prevent open redirect vulnerabilities
  if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next;
  }
  return '/dashboard';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Handle provider cancellation or OAuth errors
  if (error || error_description) {
    const isCancelled =
      error === 'access_denied' ||
      error_description?.toLowerCase().includes('cancel') ||
      error_description?.toLowerCase().includes('abort');

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set(
      'error',
      isCancelled
        ? 'Sign-in was cancelled.'
        : error_description || error || 'Authentication failed. Please try again.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();

  // 1. Handle OAuth Code or PKCE Code Exchange
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError && data?.user) {
      // Ensure user profile exists without overwriting existing academic profile or roles
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const metadata = data.user.user_metadata || {};
          const fullName =
            metadata.full_name ||
            metadata.name ||
            data.user.email?.split('@')[0] ||
            'User';
          const avatarUrl = metadata.avatar_url || metadata.picture || null;

          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
          });
        }
      } catch (profileErr) {
        // Continue if trigger or RLS already handled profile creation
        console.error('Profile check in OAuth callback:', profileErr);
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = getSafeDestination(next);
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Handle OTP Token Hash Verification (e.g. email confirmation or magic links)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!verifyError) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = getSafeDestination(next);
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. Fallback on invalid or expired credentials
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';
  redirectUrl.searchParams.set(
    'error',
    'Authentication link invalid or expired. Please sign in or request a new link.'
  );
  return NextResponse.redirect(redirectUrl);
}

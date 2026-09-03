import { createBrowserClient } from "@supabase/ssr";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://build-placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.buildplaceholder',
    {
      cookieOptions: {
        maxAge: ONE_YEAR,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  );
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://build-placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.buildplaceholder',
    {
      cookieOptions: {
        maxAge: ONE_YEAR,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: options?.maxAge ?? ONE_YEAR,
                path: options?.path ?? '/',
                sameSite: (options?.sameSite ?? 'lax') as 'lax',
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

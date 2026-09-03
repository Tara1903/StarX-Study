import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function createClient() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('studchat_demo')?.value === 'true';

  const client = createServerClient(
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

  if (isDemo) {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async (jwt?: string) => {
      try {
        const res = await originalGetUser(jwt);
        if (res.data?.user) return res;
      } catch {
        // Fall through to demo user
      }
      return {
        data: {
          user: {
            id: 'demo-student-id',
            email: 'aarav.sharma@sageuniversity.edu.in',
            app_metadata: {},
            user_metadata: { full_name: 'Aarav Sharma' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
        },
        error: null,
      };
    };
  }

  return client;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: options?.maxAge ?? ONE_YEAR,
              path: options?.path ?? '/',
              sameSite: (options?.sameSite ?? 'lax') as 'lax',
            });
          });
        },
      },
    }
  );

  // IMPORTANT: Do not use supabase.auth.getSession() as it reads from cookies
  // without validation. Use getUser() which validates the JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Demo session support for offline testing and review
  const isDemo =
    request.cookies.get('studchat_demo')?.value === 'true' ||
    request.nextUrl.searchParams.get('demo') === 'true';

  if (request.nextUrl.searchParams.get('demo') === 'true') {
    supabaseResponse.cookies.set('studchat_demo', 'true', {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
    });
  }

  // Redirect unauthenticated users trying to access protected routes
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password");

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/timetable") ||
    request.nextUrl.pathname.startsWith("/subjects") ||
    request.nextUrl.pathname.startsWith("/announcements") ||
    request.nextUrl.pathname.startsWith("/assignments") ||
    request.nextUrl.pathname.startsWith("/notifications") ||
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/super-admin");

  if (!user && !isDemo && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (unless explicitly logging out)
  if ((user || isDemo) && isAuthRoute && !request.nextUrl.searchParams.has('logout')) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const ROLE_ROUTES = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
};

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  // 1. Admin Cookie Check for dedicated Admin Session
  const isAdminSession = request.cookies.get('lms_admin_session')?.value === 'true';

  if (pathname.startsWith('/admin')) {
    if (isAdminSession) {
      return supabaseResponse;
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If public route, allow access
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    if (user && (pathname === '/login' || pathname === '/register')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole = profile?.role || user.user_metadata?.role || (isAdminSession ? 'admin' : 'student');
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
    }
    return supabaseResponse;
  }

  // If Admin Route & Admin Session Cookie is active, bypass
  if (pathname.startsWith('/admin') && (isAdminSession || user?.user_metadata?.role === 'admin')) {
    return supabaseResponse;
  }

  // If not logged in and no admin cookie, redirect to login
  if (!user && !isAdminSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // Check role in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const userRole = profile?.role || user.user_metadata?.role || (isAdminSession ? 'admin' : null);

    // If accessing admin routes and user is admin, allow
    if (pathname.startsWith('/admin') && (userRole === 'admin' || isAdminSession)) {
      return supabaseResponse;
    }

    // Role route matching
    if (userRole) {
      for (const [role, routePrefix] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(routePrefix) && role !== userRole && !isAdminSession) {
          return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

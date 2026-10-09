import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'rivo_session';

// Protected path prefixes requiring institutional or role sessions
const PROTECTED_PREFIXES = ['/admin', '/school', '/teacher', '/parent'];

// Public auth routes where already-authenticated users can be redirected
const AUTH_PAGES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Enforce Server-Side Edge Guard on protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    if (!sessionToken || sessionToken.trim() === '') {
      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
      const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirect authenticated users away from /login or /signup
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  if (isAuthPage && sessionToken && sessionToken.trim() !== '') {
    // We let the client AuthContext or dashboard router resolve target dashboard, or allow access to switch accounts
  }

  // 3. Security Headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

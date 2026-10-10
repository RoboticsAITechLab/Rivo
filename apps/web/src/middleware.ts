import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'rivo_session';

// Protected path prefixes requiring institutional or role sessions
const PROTECTED_PREFIXES = ['/testing-center', '/admin', '/school', '/teacher', '/parent'];

// Public auth routes where already-authenticated users can be redirected
const AUTH_PAGES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Redirect legacy /admin/testing to standalone /testing-center
  if (pathname === '/admin/testing' || pathname.startsWith('/admin/testing/')) {
    return NextResponse.redirect(new URL('/testing-center', request.url));
  }

  // 2. Enforce Server-Side Edge Guard on protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    if (!sessionToken || sessionToken.trim() === '') {
      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
      const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Security Headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Prevent search engine indexing of Testing Platform
  if (pathname.startsWith('/testing-center') || pathname.startsWith('/api/testing-center')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

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

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, revokeSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

export async function POST(req: NextRequest) {
  try {
    const rawToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    if (rawToken) {
      await revokeSession(rawToken);
      await logSecurityAudit({
        event: 'LOGOUT',
        ipAddress: ip,
        userAgent,
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  }
}

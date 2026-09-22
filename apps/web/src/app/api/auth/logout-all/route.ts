import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, revokeAllUserSessions } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/authorize';
import { logSecurityAudit } from '@/lib/auth/audit';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    const revokedCount = await revokeAllUserSessions(auth.userId);

    await logSecurityAudit({
      event: 'LOGOUT_ALL',
      userId: auth.userId,
      schoolId: auth.schoolId,
      ipAddress: ip,
      userAgent,
      details: { revokedCount },
    });

    const response = NextResponse.json({
      success: true,
      message: 'All active sessions have been revoked.',
      revokedCount,
    });

    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Error during logout-all:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

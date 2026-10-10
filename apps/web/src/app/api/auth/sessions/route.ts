import { NextRequest, NextResponse } from 'next/server';
import {
  getValidSession,
  listUserActiveSessions,
  revokeSessionById,
  revokeOtherUserSessions,
} from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

// GET /api/auth/sessions -> list active sessions for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getValidSession(req);
    if (!session) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const sessions = await listUserActiveSessions(session.userId, session.sessionId);
    return NextResponse.json({
      success: true,
      sessions,
      currentSessionId: session.sessionId,
    });
  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve active sessions' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/sessions -> revoke specific session or all other sessions
export async function DELETE(req: NextRequest) {
  try {
    const session = await getValidSession(req);
    if (!session) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetSessionId = searchParams.get('id');
    const revokeOthers = searchParams.get('allOthers') === 'true';

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    if (revokeOthers) {
      const count = await revokeOtherUserSessions(session.userId, session.sessionId);
      await logSecurityAudit({
        event: 'LOGOUT_ALL',
        userId: session.userId,
        schoolId: session.schoolId || undefined,
        ipAddress: ip,
        userAgent,
        details: { terminatedCount: count, retainedSessionId: session.sessionId },
      });

      return NextResponse.json({
        success: true,
        message: `${count} other session${count === 1 ? '' : 's'} terminated successfully.`,
        terminatedCount: count,
      });
    }

    if (!targetSessionId) {
      return NextResponse.json(
        { message: 'Session ID parameter (?id=...) or ?allOthers=true is required.' },
        { status: 400 }
      );
    }

    if (targetSessionId === session.sessionId) {
      return NextResponse.json(
        { message: 'To terminate your current active session, please use the logout action.' },
        { status: 400 }
      );
    }

    const revoked = await revokeSessionById(targetSessionId, session.userId);
    if (!revoked) {
      return NextResponse.json(
        { message: 'Session not found or already terminated.' },
        { status: 404 }
      );
    }

    await logSecurityAudit({
      event: 'SESSION_REVOKED',
      userId: session.userId,
      schoolId: session.schoolId || undefined,
      ipAddress: ip,
      userAgent,
      details: { revokedSessionId: targetSessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully.',
    });
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to revoke session' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMfaChallenge } from '@/lib/auth/mfa';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { mfaRateLimiter } from '@/lib/auth/rate-limiter';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/mfa/challenge - Verify MFA during login to establish authenticated session
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    // Rate limiting check
    const rateLimit = await mfaRateLimiter.consume(`mfa:${ip}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many verification attempts. Please wait 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { challengeToken, code } = body;

    if (!challengeToken || !code) {
      return NextResponse.json(
        { message: 'Challenge token and verification code are required.' },
        { status: 400 }
      );
    }

    const verification = await verifyMfaChallenge(challengeToken, code);
    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { message: verification.error || 'Invalid verification code.' },
        { status: 401 }
      );
    }

    // Lookup user, primary active school membership, and teacher profile
    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { school: true },
        },
        teachers: true,
      },
    });

    if (!user || !user.isActive || user.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'User account is inactive or suspended.' }, { status: 403 });
    }

    const primaryMembership = user.memberships[0];
    if (!primaryMembership) {
      return NextResponse.json({ message: 'User has no active school membership.' }, { status: 403 });
    }

    const teacherProfile = user.teachers?.find((t) => t.schoolId === primaryMembership.schoolId);
    const role = primaryMembership.role;

    // Create session in PostgreSQL
    const { rawToken } = await createSession({
      userId: user.id,
      schoolId: primaryMembership.schoolId,
      ipAddress: ip,
      userAgent,
    });

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logSecurityAudit({
      userId: user.id,
      schoolId: primaryMembership.schoolId,
      event: 'MFA_LOGIN_SUCCESS',
      ipAddress: ip,
      userAgent,
      details: {
        method: verification.isRecovery ? 'RECOVERY_CODE' : 'TOTP',
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'MFA verified successfully.',
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone || undefined,
        role: role === 'SCHOOL_ADMIN'
          ? 'School Administrator'
          : role === 'TEACHER'
          ? 'Teacher'
          : role,
        roleType: role,
        initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'US',
        schoolId: primaryMembership.schoolId,
        schoolName: primaryMembership.school.name,
        schoolSlug: primaryMembership.school.slug,
        teacherId: teacherProfile?.id,
      },
    });

    // Set HttpOnly session cookie
    setSessionCookie(response, rawToken);

    return response;
  } catch (error) {
    console.error('Error in POST /api/auth/mfa/challenge:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

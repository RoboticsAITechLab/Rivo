import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, normalizeEmail } from '@/lib/auth/normalize';
import { verifyOtp } from '@/lib/auth/otp';
import { createMfaChallenge } from '@/lib/auth/mfa';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/parent/otp/verify - Verify OTP and establish parent session or prompt MFA
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    const body = await req.json().catch(() => ({}));
    const { phone, email, code, schoolId } = body;

    if (!code) {
      return NextResponse.json(
        { message: 'Verification code is required.' },
        { status: 400 }
      );
    }

    let identifier: string | null = null;
    let type: 'PHONE' | 'EMAIL' = 'PHONE';

    if (phone) {
      identifier = normalizePhone(phone);
      type = 'PHONE';
    } else if (email) {
      identifier = normalizeEmail(email);
      type = 'EMAIL';
    }

    if (!identifier) {
      return NextResponse.json(
        { message: 'Valid phone number or email is required.' },
        { status: 400 }
      );
    }

    // 1. Verify OTP with anti-brute force and attempt tracking
    const verification = await verifyOtp({
      identifier,
      type,
      code,
      ipAddress: ip,
    });

    if (!verification.valid) {
      return NextResponse.json(
        {
          message: verification.error || 'Invalid verification code.',
          attemptsRemaining: verification.attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // 2. Lookup eligible parent user
    const user = await prisma.user.findFirst({
      where: {
        ...(type === 'PHONE' ? { phone: identifier } : { email: identifier }),
        isActive: true,
        status: 'ACTIVE',
      },
      include: {
        memberships: {
          where: { role: 'PARENT', status: 'ACTIVE' },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
        mfa: true,
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { message: 'No active parent account found matching these credentials.' },
        { status: 403 }
      );
    }

    // 3. MFA Check: If parent enabled MFA, issue MFA challenge token
    if (user.mfa && user.mfa.enabled) {
      const challengeToken = await createMfaChallenge(user.id);

      await logSecurityAudit({
        userId: user.id,
        event: 'MFA_CHALLENGE_ISSUED_PARENT',
        ipAddress: ip,
        userAgent,
        details: { identifier: identifier.slice(0, 4) + '***', type },
      });

      return NextResponse.json({
        success: true,
        mfaRequired: true,
        challengeToken,
        message: 'Two-factor authentication required. Please enter your authenticator code.',
      });
    }

    // 4. Resolve School Tenant Context
    let targetSchoolId: string | null = null;

    if (schoolId) {
      // Validate that parent actually belongs to the requested school
      const matchingMembership = user.memberships.find((m) => m.schoolId === schoolId);
      if (matchingMembership) {
        targetSchoolId = matchingMembership.schoolId;
      }
    }

    if (!targetSchoolId) {
      // Default to first active school membership
      targetSchoolId = user.memberships[0].schoolId;
    }

    // 5. Create secure session
    const { rawToken } = await createSession({
      userId: user.id,
      schoolId: targetSchoolId,
      ipAddress: ip,
      userAgent,
    });

    // 6. Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logSecurityAudit({
      userId: user.id,
      schoolId: targetSchoolId,
      event: 'LOGIN_SUCCESS_PARENT_OTP',
      ipAddress: ip,
      userAgent,
      details: { identifier: identifier.slice(0, 4) + '***', type, schoolId: targetSchoolId },
    });

    const schools = user.memberships.map((m) => ({
      id: m.school.id,
      name: m.school.name,
      slug: m.school.slug,
    }));

    const activeSchool = schools.find((s) => s.id === targetSchoolId) || schools[0];

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      token: rawToken, // Provided for mobile clients (Dio Authorization header)
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        role: 'PARENT',
      },
      activeSchool,
      schools,
      requiresSchoolSelection: schools.length > 1,
    });

    // Set HTTP-only secure cookie for web browser client
    setSessionCookie(response, rawToken);

    return response;
  } catch (error) {
    console.error('Error in POST /api/auth/parent/otp/verify:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

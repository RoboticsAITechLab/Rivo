import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/crypto';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { loginRateLimiter } from '@/lib/auth/rate-limiter';
import { logSecurityAudit } from '@/lib/auth/audit';
import { createMfaChallenge } from '@/lib/auth/mfa';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Rate limiting check
    const rateLimitKey = `${ip}:${trimmedEmail}`;
    const rateLimit = await loginRateLimiter.consume(rateLimitKey);
    if (!rateLimit.allowed) {
      await logSecurityAudit({
        event: 'LOGIN_FAILURE',
        ipAddress: ip,
        userAgent,
        details: { email: trimmedEmail, reason: 'RATE_LIMITED' },
      });

      return NextResponse.json(
        {
          message: 'Too many failed attempts. Please try again in 15 minutes.',
        },
        { status: 429 }
      );
    }

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            school: true,
            customRole: true,
          },
        },
        teachers: {
          where: { status: 'ACTIVE' },
        },
        mfa: true,
      },
    });

    // Timing-safe verification & account enumeration prevention
    if (!user || !user.isActive || user.status !== 'ACTIVE') {
      await logSecurityAudit({
        event: 'LOGIN_FAILURE',
        ipAddress: ip,
        userAgent,
        details: { email: trimmedEmail, reason: 'USER_NOT_FOUND_OR_INACTIVE' },
      });

      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 2. Verify password with secure scrypt
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logSecurityAudit({
        event: 'LOGIN_FAILURE',
        userId: user.id,
        ipAddress: ip,
        userAgent,
        details: { email: trimmedEmail, reason: 'INVALID_PASSWORD' },
      });

      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 3. Resolve identity: Platform User vs School Tenant User
    const platformRole = user.platformRole || (user.isPlatformOwner ? 'OWNER' : null);
    const primaryMembership = user.memberships[0];

    // If neither platform role nor school membership exists, deny login
    if (!platformRole && !primaryMembership) {
      await logSecurityAudit({
        event: 'LOGIN_FAILURE',
        userId: user.id,
        ipAddress: ip,
        userAgent,
        details: { email: trimmedEmail, reason: 'NO_ACTIVE_MEMBERSHIP_OR_PLATFORM_ROLE' },
      });

      return NextResponse.json(
        { message: 'No active institutional membership or platform role found for this account.' },
        { status: 403 }
      );
    }

    // Check if MFA is enabled on the account
    if (user.mfa && user.mfa.enabled) {
      const challengeToken = await createMfaChallenge(user.id);
      return NextResponse.json({
        success: true,
        mfaRequired: true,
        challengeToken,
        message: 'MFA verification required.',
      });
    }

    // Determine session scope: Platform User logs in with schoolId = null (unless only a school member)
    const isPlatformLogin = !!platformRole && !primaryMembership;
    const sessionSchoolId = isPlatformLogin ? null : (primaryMembership ? primaryMembership.schoolId : null);

    // 4. Create database-backed Session
    const { rawToken } = await createSession({
      userId: user.id,
      schoolId: sessionSchoolId,
      rememberMe: !!rememberMe,
      ipAddress: ip,
      userAgent,
    });

    // 5. Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Reset rate limiter on successful login
    loginRateLimiter.reset(rateLimitKey);

    // 7. Audit log success
    await logSecurityAudit({
      event: 'LOGIN_SUCCESS',
      userId: user.id,
      schoolId: sessionSchoolId,
      ipAddress: ip,
      userAgent,
      details: {
        scope: isPlatformLogin ? 'PLATFORM' : 'SCHOOL',
        role: isPlatformLogin ? platformRole : primaryMembership?.role,
      },
    });

    const teacherProfile = user.teachers[0];

    const authUser = isPlatformLogin
      ? {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone || undefined,
          role: platformRole === 'OWNER' ? 'Platform Owner' : 'Platform Administrator',
          roleType: platformRole,
          scope: 'PLATFORM' as const,
          platformRole,
          initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'PO',
        }
      : {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone || undefined,
          role: primaryMembership?.role === 'DIRECTOR'
            ? 'Director'
            : primaryMembership?.role === 'PRINCIPAL'
            ? 'Principal'
            : primaryMembership?.role === 'SCHOOL_ADMIN' || primaryMembership?.role === 'ADMIN'
            ? 'School Administrator'
            : primaryMembership?.role === 'TEACHER'
            ? 'Teacher'
            : primaryMembership?.role || 'User',
          roleType: primaryMembership?.role,
          scope: 'SCHOOL' as const,
          platformRole: user.platformRole,
          initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'US',
          schoolId: primaryMembership?.school.id,
          schoolName: primaryMembership?.school.name,
          schoolSlug: primaryMembership?.school.slug,
          teacherId: teacherProfile?.id,
        };

    const response = NextResponse.json({
      success: true,
      user: authUser,
    });

    // 8. Set HttpOnly Cookie with raw session token
    setSessionCookie(response, rawToken, !!rememberMe);

    return response;
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

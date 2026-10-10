import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';
import { forgotPasswordRateLimiter } from '@/lib/auth/rate-limiter';
import { logSecurityAudit } from '@/lib/auth/audit';
import { sendPasswordResetEmail } from '@/lib/email/email-service';
import { getSchoolSetting } from '@/lib/settings/settings-service';

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`.replace(/\/+$/, '');
  }
  const origin = req.headers.get('origin');
  if (origin) {
    return origin.replace(/\/+$/, '');
  }
  if (req.nextUrl?.origin && !req.nextUrl.origin.includes('0.0.0.0')) {
    return req.nextUrl.origin.replace(/\/+$/, '');
  }
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return appUrl.replace(/\/+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    if (!email) {
      return NextResponse.json({ message: 'Email address is required.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Rate limiting check
    const rateLimitKey = `${ip}:${trimmedEmail}`;
    const rateLimit = await forgotPasswordRateLimiter.consume(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many password reset requests. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // Lookup user with active institutional memberships
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    // If user exists and is active, issue single-use secure reset token
    if (user && user.isActive && user.status === 'ACTIVE') {
      const primaryMembership = user.memberships[0];
      let expiryHours = 24;

      if (primaryMembership) {
        try {
          const schoolSetting = await getSchoolSetting(primaryMembership.schoolId, 'security');
          const recoveryPolicy = schoolSetting?.recovery;

          // Policy check: Enforce institutional self-service password reset toggle
          if (recoveryPolicy && recoveryPolicy.allowSelfServiceReset === false) {
            await logSecurityAudit({
              event: 'PASSWORD_RESET_REQUEST',
              userId: user.id,
              schoolId: primaryMembership.schoolId,
              ipAddress: ip,
              userAgent,
              details: { email: trimmedEmail, status: 'REJECTED', reason: 'SELF_SERVICE_RESET_DISABLED' },
            });

            return NextResponse.json(
              { message: 'Self-service password reset is disabled by institutional policy. Please contact your administrator.' },
              { status: 403 }
            );
          }

          if (recoveryPolicy?.resetLinkExpiryHours && recoveryPolicy.resetLinkExpiryHours > 0) {
            expiryHours = recoveryPolicy.resetLinkExpiryHours;
          }
        } catch (settingsError) {
          console.warn('[FORGOT_PASSWORD] Failed to resolve school security setting, using defaults:', settingsError);
        }
      }

      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      // Invalidate any prior unused reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new token record
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await logSecurityAudit({
        event: 'PASSWORD_RESET_REQUEST',
        userId: user.id,
        schoolId: primaryMembership?.schoolId || null,
        ipAddress: ip,
        userAgent,
        details: { email: trimmedEmail },
      });

      const baseUrl = getBaseUrl(req);
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail({
          to: trimmedEmail,
          resetUrl,
          userId: user.id,
          schoolId: primaryMembership?.schoolId,
          ipAddress: ip,
          userAgent,
        });
      } catch (emailError) {
        console.error('[FORGOT_PASSWORD] Failed to send password reset email:', emailError);
      }
    }

    // Generic response regardless of whether email exists (prevents account enumeration)
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email address, we've sent password reset instructions.",
    });
  } catch (error) {
    console.error('Error in /api/auth/forgot-password:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

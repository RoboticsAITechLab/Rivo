import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, hashToken, validatePasswordPolicy } from '@/lib/auth/crypto';
import { resetPasswordRateLimiter } from '@/lib/auth/rate-limiter';
import { revokeAllUserSessions } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimit = await resetPasswordRateLimiter.consume(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many reset attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Password policy check
    const passwordValidation = validatePasswordPolicy(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          message: passwordValidation.errors[0] || 'Password does not meet complexity requirements.',
          errors: passwordValidation.errors,
        },
        { status: 422 }
      );
    }

    const tokenHash = hashToken(token);

    // Find valid, unused, non-expired token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Reset link is invalid or expired.' },
        { status: 400 }
      );
    }

    const user = resetRecord.user;
    if (!user || !user.isActive || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Account is inactive or disabled. Contact administrator.' },
        { status: 403 }
      );
    }

    const newHashedPassword = await hashPassword(newPassword);

    // Execute atomic update
    await prisma.$transaction(async (tx) => {
      // 1. Update password hash
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHashedPassword,
          updatedAt: new Date(),
        },
      });

      // 2. Mark reset token as used (single-use)
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    });

    // 3. Invalidate ALL existing active sessions for this user (Phase 16)
    await revokeAllUserSessions(user.id);

    // 4. Audit log success
    await logSecurityAudit({
      event: 'PASSWORD_RESET_SUCCESS',
      userId: user.id,
      ipAddress: ip,
      userAgent,
      details: { email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Error in /api/auth/reset-password:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

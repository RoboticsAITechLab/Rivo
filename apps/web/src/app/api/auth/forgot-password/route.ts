import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';
import { forgotPasswordRateLimiter } from '@/lib/auth/rate-limiter';
import { logSecurityAudit } from '@/lib/auth/audit';
import { sendPasswordResetEmail } from '@/lib/email/email-service';

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

    // Lookup user
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // If user exists and is active, issue single-use secure reset token
    if (user && user.isActive && user.status === 'ACTIVE') {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
        ipAddress: ip,
        userAgent,
        details: { email: trimmedEmail },
      });

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail({
        to: trimmedEmail,
        resetUrl,
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });
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

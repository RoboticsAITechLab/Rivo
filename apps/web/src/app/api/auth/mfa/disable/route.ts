import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { verifyPassword } from '@/lib/auth/crypto';
import {
  decryptMfaSecret,
  verifyTotpCode,
  verifyAndConsumeRecoveryCode,
} from '@/lib/auth/mfa';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/mfa/disable - Disable MFA with strict re-authentication (password + TOTP/Recovery code)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { password, code } = body;

    if (!password || !code) {
      return NextResponse.json(
        { message: 'Both password and verification code are required to disable MFA.' },
        { status: 400 }
      );
    }

    // Lookup full user record
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { mfa: true },
    });

    if (!user || !user.mfa || !user.mfa.enabled) {
      return NextResponse.json({ message: 'MFA is not enabled on this account.' }, { status: 400 });
    }

    // 1. Verify current password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
    }

    // 2. Verify second factor (TOTP or recovery code)
    const cleanCode = String(code).trim();
    let isCodeValid = false;

    if (/^\d{6}$/.test(cleanCode)) {
      try {
        const secret = decryptMfaSecret(user.mfa.secretEncrypted);
        isCodeValid = verifyTotpCode(secret, cleanCode);
      } catch {
        isCodeValid = false;
      }
    }

    if (!isCodeValid) {
      // Check recovery code
      isCodeValid = await verifyAndConsumeRecoveryCode(user.id, cleanCode);
    }

    if (!isCodeValid) {
      return NextResponse.json({ message: 'Invalid verification code.' }, { status: 401 });
    }

    // Atomically disable MFA and remove all recovery codes
    await prisma.$transaction(async (tx) => {
      await tx.userMfa.update({
        where: { userId: user.id },
        data: {
          enabled: false,
          verifiedAt: null,
        },
      });

      await tx.mfaRecoveryCode.deleteMany({
        where: { userId: user.id },
      });
    });

    await logSecurityAudit({
      userId: user.id,
      schoolId: auth.schoolId,
      event: 'MFA_DISABLED',
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: 'MFA has been disabled on your account.',
    });
  } catch (error) {
    console.error('Error in POST /api/auth/mfa/disable:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

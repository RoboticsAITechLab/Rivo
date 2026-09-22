import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import {
  decryptMfaSecret,
  verifyTotpCode,
  generateRecoveryCodes,
} from '@/lib/auth/mfa';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/mfa/verify - Verify initial TOTP code to confirm and activate MFA
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ message: '6-digit verification code is required.' }, { status: 400 });
    }

    const userMfa = await prisma.userMfa.findUnique({
      where: { userId: auth.userId },
    });

    if (!userMfa) {
      return NextResponse.json({ message: 'No pending MFA enrollment found.' }, { status: 400 });
    }

    let secret = '';
    try {
      secret = decryptMfaSecret(userMfa.secretEncrypted);
    } catch {
      return NextResponse.json({ message: 'Decryption error during verification.' }, { status: 500 });
    }

    const isValid = verifyTotpCode(secret, code.trim());
    if (!isValid) {
      await logSecurityAudit({
        userId: auth.userId,
        schoolId: auth.schoolId,
        event: 'MFA_VERIFICATION_FAILED',
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req.headers.get('user-agent') || null,
      });

      return NextResponse.json({ message: 'Invalid code. Please try again.' }, { status: 400 });
    }

    // Generate 8 single-use recovery codes
    const { rawCodes, hashedCodes } = generateRecoveryCodes(8);

    // Atomically activate MFA and store hashed recovery codes
    await prisma.$transaction(async (tx) => {
      await tx.userMfa.update({
        where: { userId: auth.userId },
        data: {
          enabled: true,
          verifiedAt: new Date(),
        },
      });

      // Clear any prior recovery codes
      await tx.mfaRecoveryCode.deleteMany({
        where: { userId: auth.userId },
      });

      // Store hashed recovery codes
      await tx.mfaRecoveryCode.createMany({
        data: hashedCodes.map((codeHash) => ({
          userId: auth.userId,
          codeHash,
        })),
      });
    });

    await logSecurityAudit({
      userId: auth.userId,
      schoolId: auth.schoolId,
      event: 'MFA_ENABLED',
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: 'MFA has been successfully enabled on your account.',
      recoveryCodes: rawCodes, // Shown ONCE to user
    });
  } catch (error) {
    console.error('Error verifying MFA setup:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { verifyPassword } from '@/lib/auth/crypto';
import { generateRecoveryCodes } from '@/lib/auth/mfa';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/mfa/recovery-codes - Regenerate fresh recovery codes (requires password confirmation)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ message: 'Password confirmation is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { mfa: true },
    });

    if (!user || !user.mfa || !user.mfa.enabled) {
      return NextResponse.json({ message: 'MFA is not enabled on this account.' }, { status: 400 });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
    }

    const { rawCodes, hashedCodes } = generateRecoveryCodes(8);

    await prisma.$transaction(async (tx) => {
      // Invalidate old recovery codes
      await tx.mfaRecoveryCode.deleteMany({
        where: { userId: user.id },
      });

      // Insert new hashed codes
      await tx.mfaRecoveryCode.createMany({
        data: hashedCodes.map((codeHash) => ({
          userId: user.id,
          codeHash,
        })),
      });
    });

    await logSecurityAudit({
      userId: user.id,
      schoolId: auth.schoolId,
      event: 'MFA_RECOVERY_CODES_REGENERATED',
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: 'New recovery codes generated successfully. Store them in a safe place.',
      recoveryCodes: rawCodes, // Displayed ONCE
    });
  } catch (error) {
    console.error('Error regenerating recovery codes:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

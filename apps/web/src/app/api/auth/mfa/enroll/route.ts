import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import {
  generateTotpSecret,
  generateQrCodeDataUrl,
  encryptMfaSecret,
} from '@/lib/auth/mfa';
import { logSecurityAudit } from '@/lib/auth/audit';

// GET /api/auth/mfa/enroll - Check current MFA status for user
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const mfa = await prisma.userMfa.findUnique({
      where: { userId: auth.userId },
      select: { enabled: true, verifiedAt: true },
    });

    const remainingCodesCount = await prisma.mfaRecoveryCode.count({
      where: { userId: auth.userId, usedAt: null },
    });

    return NextResponse.json({
      enabled: !!mfa?.enabled,
      verifiedAt: mfa?.verifiedAt || null,
      remainingCodesCount,
    });
  } catch (error) {
    console.error('Error fetching MFA status:', error);
    return NextResponse.json({ enabled: false, remainingCodesCount: 0 }, { status: 500 });
  }
}

// POST /api/auth/mfa/enroll - Start MFA enrollment for authenticated user
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { secret, uri } = generateTotpSecret(auth.session.email || 'user@rivo.school');
    const qrCode = await generateQrCodeDataUrl(uri);
    const secretEncrypted = encryptMfaSecret(secret);

    // Save unverified MFA secret
    await prisma.userMfa.upsert({
      where: { userId: auth.userId },
      update: {
        secretEncrypted,
        enabled: false,
        verifiedAt: null,
      },
      create: {
        userId: auth.userId,
        secretEncrypted,
        enabled: false,
      },
    });

    await logSecurityAudit({
      userId: auth.userId,
      schoolId: auth.schoolId,
      event: 'MFA_ENROLLMENT_STARTED',
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      qrCode,
      qrCodeDataUrl: qrCode,
      otpauthUri: uri,
      uri,
      secret,
      manualEntryKey: secret,
    });
  } catch (error) {
    console.error('Error starting MFA enrollment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import {
  generateTotpSecret,
  generateQrCodeDataUrl,
  encryptMfaSecret,
} from '@/lib/auth/mfa';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/mfa/enroll - Start MFA enrollment for authenticated user
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { secret, uri } = generateTotpSecret(auth.session.email);
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
      otpauthUri: uri,
      manualEntryKey: secret, // Shown during setup only so user can configure app
    });
  } catch (error) {
    console.error('Error starting MFA enrollment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

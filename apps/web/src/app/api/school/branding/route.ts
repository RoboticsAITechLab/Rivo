import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import {
  getSchoolSetting,
  updateSchoolSetting,
} from '@/lib/settings/settings-service';
import { logSecurityAudit } from '@/lib/auth/audit';

// GET /api/school/branding
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const [school, brandingSetting] = await Promise.all([
      prisma.school.findUnique({
        where: { id: auth.schoolId },
        select: { logoUrl: true },
      }),
      getSchoolSetting(auth.schoolId, 'branding'),
    ]);

    const data = {
      ...brandingSetting,
      primaryLogoUrl: school?.logoUrl || brandingSetting.primaryLogoUrl || '',
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[BRANDING_GET_ERROR] Failed to fetch branding settings:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch branding settings' },
      { status: 500 }
    );
  }
}

// PUT /api/school/branding
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.manage' });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const body = await req.json();
    const { primaryLogoUrl, ...brandingData } = body;

    // If primaryLogoUrl is provided, update School.logoUrl as well
    if (primaryLogoUrl !== undefined) {
      await prisma.school.update({
        where: { id: auth.schoolId },
        data: { logoUrl: primaryLogoUrl || null },
      });
    }

    const updated = await updateSchoolSetting(
      auth.schoolId,
      'branding',
      {
        ...(primaryLogoUrl !== undefined ? { primaryLogoUrl } : {}),
        ...brandingData,
      },
      auth.userId
    );

    await logSecurityAudit({
      event: 'PERMISSION_CHANGED',
      schoolId: auth.schoolId,
      userId: auth.userId,
      details: {
        action: 'UPDATE_SCHOOL_BRANDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Branding settings updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[BRANDING_PUT_ERROR] Failed to update branding settings:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update branding settings' },
      { status: 500 }
    );
  }
}

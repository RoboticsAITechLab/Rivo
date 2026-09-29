import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import {
  getSchoolSetting,
  getAllSchoolSettings,
  updateSchoolSetting,
  SettingCategory,
  DEFAULT_SETTINGS,
} from '@/lib/settings/settings-service';
import { logSecurityAudit } from '@/lib/auth/audit';

// GET /api/school/settings?category=...
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as SettingCategory | null;

    if (category) {
      if (!(category in DEFAULT_SETTINGS)) {
        return NextResponse.json(
          { message: `Invalid settings category: ${category}` },
          { status: 400 }
        );
      }
      const data = await getSchoolSetting(auth.schoolId, category);
      return NextResponse.json({ success: true, category, data });
    }

    const allSettings = await getAllSchoolSettings(auth.schoolId);
    return NextResponse.json({ success: true, data: allSettings });
  } catch (error: any) {
    console.error('[SETTINGS_GET_ERROR] Failed to fetch settings:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/school/settings
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
    const { category, value } = body;

    if (!category || !(category in DEFAULT_SETTINGS)) {
      return NextResponse.json(
        { message: `Valid category is required. Supported: ${Object.keys(DEFAULT_SETTINGS).join(', ')}` },
        { status: 400 }
      );
    }

    if (!value || typeof value !== 'object') {
      return NextResponse.json(
        { message: 'Setting value object is required' },
        { status: 400 }
      );
    }

    // Role-specific settings guard
    const userRole = auth.role;
    const isOwnerOrDirector = userRole === 'DIRECTOR' || userRole === 'OWNER' || auth.session.platformRole === 'PLATFORM_ADMIN';
    if (category === 'security' && !isOwnerOrDirector) {
      return NextResponse.json(
        { message: 'Institutional security policies can only be modified by the Director or School Owner.' },
        { status: 403 }
      );
    }

    const updated = await updateSchoolSetting(
      auth.schoolId,
      category as SettingCategory,
      value,
      auth.userId
    );

    // Record audit event
    await logSecurityAudit({
      event: 'PERMISSION_CHANGED',
      schoolId: auth.schoolId,
      userId: auth.userId,
      details: {
        action: 'UPDATE_SCHOOL_SETTING',
        category,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${category} settings saved successfully.`,
      category,
      data: updated,
    });
  } catch (error: any) {
    console.error('[SETTINGS_PUT_ERROR] Failed to update settings:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

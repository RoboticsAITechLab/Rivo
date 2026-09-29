import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getSchoolSettingsOverview } from '@/lib/settings/settings-service';

// GET /api/school/settings/overview
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const overview = await getSchoolSettingsOverview(auth.schoolId);
    return NextResponse.json({ success: true, data: overview });
  } catch (error: any) {
    console.error('[SETTINGS_OVERVIEW_ERROR] Failed to fetch settings overview:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch settings overview' },
      { status: 500 }
    );
  }
}

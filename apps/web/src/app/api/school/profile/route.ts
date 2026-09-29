import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import {
  getUnifiedSchoolProfile,
  updateUnifiedSchoolProfile,
} from '@/lib/settings/settings-service';
import { logSecurityAudit } from '@/lib/auth/audit';

// GET /api/school/profile
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const profile = await getUnifiedSchoolProfile(auth.schoolId);
    if (!profile) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('[PROFILE_GET_ERROR] Failed to fetch school profile:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch school profile' },
      { status: 500 }
    );
  }
}

// PUT /api/school/profile
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
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Profile payload is required' }, { status: 400 });
    }

    if (body.schoolName !== undefined && !body.schoolName?.trim()) {
      return NextResponse.json({ message: 'School legal name cannot be empty' }, { status: 400 });
    }

    const updatedProfile = await updateUnifiedSchoolProfile(
      auth.schoolId,
      body,
      auth.userId
    );

    await logSecurityAudit({
      event: 'PERMISSION_CHANGED',
      schoolId: auth.schoolId,
      userId: auth.userId,
      details: {
        action: 'UPDATE_SCHOOL_PROFILE',
        schoolName: body.schoolName,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'School profile updated successfully.',
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error('[PROFILE_PUT_ERROR] Failed to update school profile:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update school profile' },
      { status: 500 }
    );
  }
}

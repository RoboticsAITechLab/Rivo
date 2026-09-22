import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import {
  getIdFormatConfig,
  updateIdFormatConfig,
} from '@/lib/id-generator';

function computePreviews(config: {
  studentPrefix: string;
  teacherPrefix: string;
  staffPrefix: string;
  includeYear: boolean;
  studentPadding: number;
  teacherPadding: number;
  staffPadding: number;
}) {
  const currentYear = new Date().getFullYear();
  const studentSeq = '1'.padStart(config.studentPadding, '0');
  const teacherSeq = '1'.padStart(config.teacherPadding, '0');
  const staffSeq = '1'.padStart(config.staffPadding, '0');

  const studentSample = config.includeYear
    ? `${config.studentPrefix}-${currentYear}-${studentSeq}`
    : `${config.studentPrefix}-${studentSeq}`;

  const teacherSample = `${config.studentPrefix}-${config.teacherPrefix}-${teacherSeq}`;
  const staffSample = `${config.studentPrefix}-${config.staffPrefix}-${staffSeq}`;

  return { studentSample, teacherSample, staffSample };
}

// GET /api/school/id-config - Fetch school ID generation format and preview
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const config = await getIdFormatConfig(auth.schoolId);
    const previews = computePreviews(config);

    return NextResponse.json({
      config,
      previews,
    });
  } catch (error) {
    console.error('Error fetching ID config:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/school/id-config - Update school ID format configuration
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const {
      studentPrefix,
      teacherPrefix,
      staffPrefix,
      includeYear,
      studentPadding,
      teacherPadding,
      staffPadding,
    } = body;

    const updated = await updateIdFormatConfig(auth.schoolId, {
      studentPrefix,
      teacherPrefix,
      staffPrefix,
      includeYear,
      studentPadding: Number(studentPadding),
      teacherPadding: Number(teacherPadding),
      staffPadding: Number(staffPadding),
    });

    const previews = computePreviews(updated);

    return NextResponse.json({
      config: updated,
      previews,
      message: 'ID generation format updated successfully.',
    });
  } catch (error) {
    console.error('Error updating ID config:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

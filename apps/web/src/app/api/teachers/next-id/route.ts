import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getNextTeacherIdPreview } from '@/lib/id-generator';

// GET /api/teachers/next-id - Return the next upcoming employee ID preview
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'teachers.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const nextId = await getNextTeacherIdPreview(auth.schoolId);

    return NextResponse.json({
      success: true,
      nextId,
    });
  } catch (error: any) {
    console.error('[NEXT_TEACHER_ID_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

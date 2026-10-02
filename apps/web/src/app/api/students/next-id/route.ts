import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getNextStudentIdPreview } from '@/lib/id-generator';

// GET /api/students/next-id - Return the next upcoming student admission number preview
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const nextId = await getNextStudentIdPreview(auth.schoolId);

    return NextResponse.json({
      success: true,
      nextId,
    });
  } catch (error: any) {
    console.error('[NEXT_STUDENT_ID_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

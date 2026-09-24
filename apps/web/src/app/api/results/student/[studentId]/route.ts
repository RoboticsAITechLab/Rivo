import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { ResultsService } from '@/lib/results/results-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { studentId } = await context.params;
    const { searchParams } = new URL(req.url);
    const examTermId = searchParams.get('examTermId') || undefined;

    const isParent = auth.role === 'PARENT';
    const isStudent = auth.role === 'STUDENT';

    const data = await ResultsService.getStudentMarksheet({
      schoolId: auth.schoolId,
      studentId,
      examTermId,
      parentUserId: isParent ? auth.userId : undefined,
      requirePublished: isParent || isStudent,
    });

    if (!data) {
      return NextResponse.json(
        { message: 'Student marksheet not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching student marksheet:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch student marksheet' },
      { status: 500 }
    );
  }
}

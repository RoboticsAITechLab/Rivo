import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { ResultsService } from '@/lib/results/results-service';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, {
    permission: 'results.publish',
  });
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { examTermId, classId, sectionId } = body;

    if (!examTermId) {
      return NextResponse.json(
        { message: 'Missing required field: examTermId' },
        { status: 400 }
      );
    }

    const result = await ResultsService.calculateResults({
      schoolId: auth.schoolId,
      examTermId,
      classId: classId === 'ALL' ? undefined : classId,
      sectionId: sectionId === 'ALL' ? undefined : sectionId,
      performedByUserId: auth.userId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculating results:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to calculate results' },
      { status: 400 }
    );
  }
}

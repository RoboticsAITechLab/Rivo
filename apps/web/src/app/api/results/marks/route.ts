import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { ResultsService } from '@/lib/results/results-service';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, {
    permission: 'results.view',
  });
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const examTermId = searchParams.get('examTermId');
    const paperId = searchParams.get('paperId');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');

    if (!examTermId || !paperId || !classId || !sectionId) {
      return NextResponse.json(
        { message: 'Missing required parameters: examTermId, paperId, classId, sectionId' },
        { status: 400 }
      );
    }

    const teacherUserId = auth.role === 'TEACHER' ? auth.userId : undefined;

    const data = await ResultsService.getMarksRoster({
      schoolId: auth.schoolId,
      examTermId,
      paperId,
      classId,
      sectionId,
      teacherUserId,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching marks roster:', error);
    const status = error.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { message: error.message || 'Failed to fetch marks roster' },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, {
    permission: 'results.enter_marks',
  });
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { examTermId, paperId, marks } = body;

    if (!examTermId || !paperId || !Array.isArray(marks)) {
      return NextResponse.json(
        { message: 'Missing required payload: examTermId, paperId, marks array' },
        { status: 400 }
      );
    }

    const result = await ResultsService.saveMarks({
      schoolId: auth.schoolId,
      examTermId,
      paperId,
      marks,
      enteredByUserId: auth.userId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error saving marks:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to save marks' },
      { status: 400 }
    );
  }
}

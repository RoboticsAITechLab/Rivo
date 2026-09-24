import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { ResultsService } from '@/lib/results/results-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ classId: string }> }
) {
  const auth = await requireAuth(req, {
    permission: 'results.view',
  });
  if (!auth.authorized) return auth.response;

  try {
    const { classId } = await context.params;
    const { searchParams } = new URL(req.url);
    const examTermId = searchParams.get('examTermId');
    const sectionId = searchParams.get('sectionId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;

    if (!examTermId) {
      return NextResponse.json(
        { message: 'Missing required query parameter: examTermId' },
        { status: 400 }
      );
    }

    const data = await ResultsService.getClassTabulation({
      schoolId: auth.schoolId,
      examTermId,
      classId,
      sectionId,
      page,
      limit,
      search,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching class tabulation:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch class tabulation' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { ResultsService } from '@/lib/results/results-service';
import { AudienceResolver, NotificationDispatcher } from '@/lib/communication/communication-service';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, {
    permission: 'results.publish',
  });
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { examTermId, publish, classId, sectionId } = body;

    if (!examTermId || typeof publish !== 'boolean') {
      return NextResponse.json(
        { message: 'Missing required parameters: examTermId, publish boolean' },
        { status: 400 }
      );
    }

    const result = await ResultsService.setPublicationStatus({
      schoolId: auth.schoolId,
      examTermId,
      publish,
      classId: classId === 'ALL' ? undefined : classId,
      sectionId: sectionId === 'ALL' ? undefined : sectionId,
      performedByUserId: auth.userId,
    });

    // If published, notify parents
    if (publish) {
      try {
        const userIds = await AudienceResolver.resolveUserIds({
          schoolId: auth.schoolId,
          targetType: classId && classId !== 'ALL' ? 'CLASS' : 'PARENTS',
          classId: classId === 'ALL' ? undefined : classId,
          sectionId: sectionId === 'ALL' ? undefined : sectionId,
        });

        await NotificationDispatcher.dispatch({
          schoolId: auth.schoolId,
          userIds,
          title: 'Formal Examination Results Published',
          body: 'Academic results and formal marksheets have been published and are now available for viewing.',
          category: 'RESULT',
          linkUrl: '/parent/results',
          priority: 'HIGH',
        });
      } catch (dispatchErr) {
        console.error('[RESULT PUBLISH NOTIFICATION ERROR]:', dispatchErr);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating publication status:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update publication status' },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { NoticeService } from '@/lib/notices/notice-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, {
    permission: 'notices.archive',
  });
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    const updated = await NoticeService.archiveNotice({
      schoolId: auth.schoolId,
      noticeId: id,
      userId: auth.userId,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error archiving notice:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to archive notice' },
      { status: 400 }
    );
  }
}

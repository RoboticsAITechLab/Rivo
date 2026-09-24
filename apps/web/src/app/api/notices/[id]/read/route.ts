import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { NoticeService } from '@/lib/notices/notice-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    const readStatus = await NoticeService.markNoticeRead({
      noticeId: id,
      userId: auth.userId,
    });

    return NextResponse.json({ success: true, readStatus });
  } catch (error: any) {
    console.error('Error marking notice as read:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to mark notice as read' },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const updated = await prisma.notification.updateMany({
      where: {
        userId: auth.userId,
        schoolId: auth.schoolId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to mark all as read' },
      { status: 500 }
    );
  }
}

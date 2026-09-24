import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {
      userId: auth.userId,
      schoolId: auth.schoolId,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: auth.userId,
        schoolId: auth.schoolId,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Missing notification id' },
        { status: 400 }
      );
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id,
        userId: auth.userId, // IDOR safety: user can only toggle own notifications
        schoolId: auth.schoolId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

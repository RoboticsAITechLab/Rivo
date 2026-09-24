import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { token, platform = 'web', action = 'register' } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Valid token string is required' },
        { status: 400 }
      );
    }

    if (action === 'unregister') {
      await prisma.deviceToken.updateMany({
        where: {
          userId: auth.userId,
          token: token.trim(),
        },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, message: 'Device token unregistered' });
    }

    const deviceToken = await prisma.deviceToken.upsert({
      where: {
        userId_token: {
          userId: auth.userId,
          token: token.trim(),
        },
      },
      create: {
        userId: auth.userId,
        token: token.trim(),
        platform,
        isActive: true,
      },
      update: {
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, deviceToken });
  } catch (error: any) {
    console.error('Error handling device token:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to handle device token' },
      { status: 500 }
    );
  }
}

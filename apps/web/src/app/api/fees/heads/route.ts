import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { createFeeHead } from '@/lib/fees/fee-plan-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const heads = await prisma.feeHead.findMany({
      where: { schoolId: auth.schoolId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = heads.map((h) => ({
      id: h.id,
      name: h.name,
      code: h.code,
      description: h.description,
      isRefundable: h.isRefundable,
      isActive: h.isActive,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      usageCount: h._count.items,
    }));

    return NextResponse.json({ heads: formatted });
  } catch (error) {
    console.error('Error in GET /api/fees/heads:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.plan_create' });
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json(
        { message: 'Fee head name and code are required.' },
        { status: 400 }
      );
    }

    const head = await createFeeHead(
      auth.schoolId,
      {
        name: body.name,
        code: body.code,
        description: body.description,
        isRefundable: body.isRefundable,
      },
      auth.session.userId
    );

    return NextResponse.json({ head }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/fees/heads:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create fee head' },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { createFeePlan } from '@/lib/fees/fee-plan-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const academicSessionId = searchParams.get('academicSessionId');
    const classId = searchParams.get('classId');
    const campusId = searchParams.get('campusId');

    const plans = await prisma.feePlan.findMany({
      where: {
        schoolId: auth.schoolId,
        ...(academicSessionId ? { academicSessionId } : {}),
        ...(classId ? { classId } : {}),
        ...(campusId ? { campusId } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            items: { include: { feeHead: true } },
            installments: { orderBy: { installmentNumber: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error in GET /api/fees/plans:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.plan_create' });
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    if (!body.academicSessionId || !body.classId || !body.name || !body.totalAmount) {
      return NextResponse.json(
        { message: 'academicSessionId, classId, name, and totalAmount are required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: 'At least one fee component (item) is required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.installments) || body.installments.length === 0) {
      return NextResponse.json(
        { message: 'At least one installment schedule entry is required.' },
        { status: 400 }
      );
    }

    const result = await createFeePlan(
      auth.schoolId,
      {
        academicSessionId: body.academicSessionId,
        campusId: body.campusId,
        classId: body.classId,
        streamId: body.streamId,
        sectionId: body.sectionId,
        name: body.name,
        code: body.code,
        description: body.description,
        totalAmount: Number(body.totalAmount),
        currency: body.currency,
        items: body.items,
        installments: body.installments,
      },
      auth.session.userId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/fees/plans:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create fee plan' },
      { status: 400 }
    );
  }
}

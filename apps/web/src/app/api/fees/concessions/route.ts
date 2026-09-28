import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const academicSessionId = searchParams.get('academicSessionId');
    const classId = searchParams.get('classId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    const where: any = {
      schoolId: auth.schoolId,
      customConcessionAmount: { gt: 0 },
    };

    if (academicSessionId) {
      where.academicSessionId = academicSessionId;
    }

    if (classId) {
      where.studentEnrollment = { classId };
    }

    if (search) {
      where.OR = [
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { admissionNumber: { contains: search, mode: 'insensitive' } } },
        { concessionReason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [concessions, total] = await Promise.all([
      prisma.studentFeeAssignment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
          studentEnrollment: {
            select: {
              rollNumber: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
          feePlanVersion: {
            select: {
              id: true,
              versionNumber: true,
              totalAmount: true,
              feePlan: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.studentFeeAssignment.count({ where }),
    ]);

    return NextResponse.json({
      concessions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/fees/concessions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.assign' });
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    if (!body.studentId || !body.studentEnrollmentId || !body.academicSessionId) {
      return NextResponse.json(
        { message: 'studentId, studentEnrollmentId, and academicSessionId are required.' },
        { status: 400 }
      );
    }

    if (!body.rateOrAmount || Number(body.rateOrAmount) <= 0) {
      return NextResponse.json(
        { message: 'A positive concession amount or percentage is required.' },
        { status: 400 }
      );
    }

    if (!body.reason || body.reason.trim().length < 5) {
      return NextResponse.json(
        { message: 'A detailed justification reason (at least 5 characters) is mandatory.' },
        { status: 400 }
      );
    }

    const { applyAdHocConcession } = await import('@/lib/fees/fee-payment-service');

    const result = await applyAdHocConcession(
      auth.schoolId,
      {
        studentId: body.studentId,
        studentEnrollmentId: body.studentEnrollmentId,
        academicSessionId: body.academicSessionId,
        type: body.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
        rateOrAmount: Number(body.rateOrAmount),
        category: body.category || 'OTHER',
        reason: body.reason.trim(),
        obligationIds: Array.isArray(body.obligationIds) ? body.obligationIds : undefined,
      },
      auth.session.userId
    );

    return NextResponse.json(
      {
        message: `Granted ₹${result.totalAppliedConcession} concession across ${result.affectedObligations.length} obligation(s).`,
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/fees/concessions:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to apply concession' },
      { status: 400 }
    );
  }
}

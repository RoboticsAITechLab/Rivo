import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { FeeReceiptStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.receipt_view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status') as FeeReceiptStatus | null;
    const academicSessionId = searchParams.get('academicSessionId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    const where: any = {
      schoolId: auth.schoolId,
    };

    if (academicSessionId) {
      where.academicSessionId = academicSessionId;
    }

    if (status && Object.values(FeeReceiptStatus).includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { payment: { paymentNumber: { contains: search, mode: 'insensitive' } } },
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { admissionNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.feeReceipt.findMany({
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
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
          payment: {
            select: {
              id: true,
              paymentNumber: true,
              paymentMode: true,
              status: true,
            },
          },
          issuedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { receiptDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.feeReceipt.count({ where }),
    ]);

    return NextResponse.json({
      receipts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/fees/receipts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

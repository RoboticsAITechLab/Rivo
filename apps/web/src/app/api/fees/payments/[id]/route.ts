import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;

    const payment = await prisma.feePayment.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            email: true,
            phone: true,
            campus: { select: { id: true, name: true } },
            parentStudents: {
              where: { isPrimaryContact: true },
              include: { parent: true },
            },
          },
        },
        studentEnrollment: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            academicSession: { select: { id: true, name: true } },
          },
        },
        collectedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reversedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        receipt: true,
        allocations: {
          include: {
            obligation: {
              include: {
                installment: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment record not found' }, { status: 404 });
    }

    // Retrieve audit logs related to this payment
    const auditLogs = await prisma.feeAuditLog.findMany({
      where: {
        schoolId: auth.schoolId,
        entityId: payment.id,
      },
      include: {
        performedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      payment,
      auditLogs,
    });
  } catch (error) {
    console.error('Error in GET /api/fees/payments/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

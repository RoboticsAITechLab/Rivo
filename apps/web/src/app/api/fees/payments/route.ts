import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { recordFeePayment } from '@/lib/fees/fee-payment-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const academicSessionId = searchParams.get('academicSessionId');

    const payments = await prisma.feePayment.findMany({
      where: {
        schoolId: auth.schoolId,
        ...(studentId ? { studentId } : {}),
        ...(academicSessionId ? { academicSessionId } : {}),
      },
      include: {
        receipt: true,
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        allocations: {
          include: { obligation: { select: { id: true, title: true, dueDate: true } } },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error in GET /api/fees/payments:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.payment_record' });
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    if (!body.academicSessionId || !body.studentId || !body.studentEnrollmentId || !body.amount || !body.paymentMode) {
      return NextResponse.json(
        { message: 'academicSessionId, studentId, studentEnrollmentId, amount, and paymentMode are required.' },
        { status: 400 }
      );
    }

    const result = await recordFeePayment(
      auth.schoolId,
      {
        academicSessionId: body.academicSessionId,
        studentId: body.studentId,
        studentEnrollmentId: body.studentEnrollmentId,
        amount: Number(body.amount),
        paymentMode: body.paymentMode,
        paymentDate: body.paymentDate,
        referenceNumber: body.referenceNumber,
        bankName: body.bankName,
        chequeDate: body.chequeDate,
        remarks: body.remarks,
        allocations: body.allocations,
      },
      auth.session.userId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/fees/payments:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to record fee payment' },
      { status: 400 }
    );
  }
}

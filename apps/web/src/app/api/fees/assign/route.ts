import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { assignFeePlanToEnrollments } from '@/lib/fees/fee-plan-service';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.assign' });
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    if (!body.academicSessionId || !body.feePlanVersionId || !Array.isArray(body.studentEnrollmentIds)) {
      return NextResponse.json(
        { message: 'academicSessionId, feePlanVersionId, and studentEnrollmentIds array are required.' },
        { status: 400 }
      );
    }

    if (body.studentEnrollmentIds.length === 0) {
      return NextResponse.json(
        { message: 'At least one studentEnrollmentId must be provided.' },
        { status: 400 }
      );
    }

    const assignments = await assignFeePlanToEnrollments(
      auth.schoolId,
      {
        academicSessionId: body.academicSessionId,
        feePlanVersionId: body.feePlanVersionId,
        studentEnrollmentIds: body.studentEnrollmentIds,
        customConcessionAmount: body.customConcessionAmount ? Number(body.customConcessionAmount) : 0,
        concessionReason: body.concessionReason,
        concessionApprovedByUserId: body.concessionApprovedByUserId,
      },
      auth.session.userId
    );

    return NextResponse.json({
      message: `Assigned fee plan to ${assignments.length} student(s) successfully.`,
      assignmentsCount: assignments.length,
      assignments,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/fees/assign:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to assign fee plan' },
      { status: 400 }
    );
  }
}

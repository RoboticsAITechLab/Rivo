import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';
import { getStudentFeeLedger } from '@/lib/fees/fee-payment-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, {
    roles: ['PARENT'],
  });
  if (!auth.authorized) return auth.response;

  try {
    const { id: studentId } = await context.params;

    if (!studentId) {
      return NextResponse.json({ message: 'Student ID is required.' }, { status: 400 });
    }

    // 1. Authorize Guardian Identity and verify Parent record in this school
    const parent = await prisma.parent.findFirst({
      where: {
        schoolId: auth.schoolId,
        userId: auth.userId,
      },
    });

    if (!parent) {
      return NextResponse.json({ message: 'Parent profile not found.' }, { status: 403 });
    }

    // 2. Strict Child Ownership Verification (Zero cross-student ID manipulation)
    const parentStudent = await prisma.parentStudent.findFirst({
      where: {
        parentId: parent.id,
        studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                class: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                academicSession: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!parentStudent || !parentStudent.student) {
      return NextResponse.json(
        { message: 'Access denied: You are not authorized to view fee records for this student.' },
        { status: 403 }
      );
    }

    // 3. Fetch Authoritative Ledger for linked child
    const ledger = await getStudentFeeLedger(auth.schoolId, studentId);

    const activeEnrollment = parentStudent.student.enrollments[0] || null;

    return NextResponse.json({
      student: {
        id: parentStudent.student.id,
        admissionNumber: parentStudent.student.admissionNumber,
        firstName: parentStudent.student.firstName,
        lastName: parentStudent.student.lastName,
        class: activeEnrollment?.class || null,
        section: activeEnrollment?.section || null,
        academicSession: activeEnrollment?.academicSession || null,
      },
      summary: ledger.summary,
      obligations: ledger.obligations,
      payments: ledger.payments,
      assignments: ledger.assignments,
    });
  } catch (error: any) {
    console.error('Error fetching parent child fees:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve fee records.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/auth/parent/select-school - Switch active school context for multi-school parent
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { schoolId } = body;

    if (!schoolId) {
      return NextResponse.json({ message: 'schoolId is required.' }, { status: 400 });
    }

    // Verify parent has an active membership in the target school
    const membership = await prisma.schoolMembership.findFirst({
      where: {
        userId: session.userId,
        schoolId,
        role: 'PARENT',
        status: 'ACTIVE',
      },
      include: {
        school: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: 'You do not have an active parent membership in this school.' },
        { status: 403 }
      );
    }

    // Update active session with the selected schoolId
    await prisma.session.update({
      where: { id: session.sessionId },
      data: { schoolId },
    });

    await logSecurityAudit({
      userId: session.userId,
      schoolId,
      event: 'PARENT_SCHOOL_SWITCHED',
      details: { newSchoolId: schoolId },
    });

    // Find children in the newly selected school
    const parentRecord = await prisma.parent.findFirst({
      where: { schoolId, userId: session.userId },
      include: {
        parentStudents: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: { status: 'ACTIVE' },
                  include: { class: true, section: true },
                },
              },
            },
          },
        },
      },
    });

    const children = (parentRecord?.parentStudents || []).map((ps) => {
      const activeEnrollment = ps.student.enrollments[0];
      return {
        id: ps.student.id,
        admissionNumber: ps.student.admissionNumber,
        firstName: ps.student.firstName,
        lastName: ps.student.lastName,
        name: `${ps.student.firstName} ${ps.student.lastName}`.trim(),
        className: activeEnrollment?.class?.name || 'Unassigned',
        sectionName: activeEnrollment?.section?.name || 'A',
        relationship: ps.relationshipType,
      };
    });

    return NextResponse.json({
      success: true,
      activeSchool: {
        id: membership.school.id,
        name: membership.school.name,
        slug: membership.school.slug,
      },
      children,
    });
  } catch (error) {
    console.error('Error in POST /api/auth/parent/select-school:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

// GET /api/auth/parent/me - Get authenticated parent context, active school, and linked children
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        memberships: {
          where: { role: 'PARENT', status: 'ACTIVE' },
          include: {
            school: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        mfa: {
          select: { enabled: true, verifiedAt: true },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ message: 'Parent profile not found' }, { status: 403 });
    }

    const schools = user.memberships.map((m) => ({
      id: m.school.id,
      name: m.school.name,
      slug: m.school.slug,
    }));

    // Active school context from session
    const activeSchoolId = session.schoolId || schools[0]?.id;
    const activeSchool = schools.find((s) => s.id === activeSchoolId) || schools[0];

    // Find children in active school
    let children: Array<{
      id: string;
      admissionNumber: string;
      firstName: string;
      lastName: string;
      name: string;
      className: string;
      sectionName: string;
      relationship: string;
    }> = [];

    if (activeSchoolId) {
      const parentRecord = await prisma.parent.findFirst({
        where: { schoolId: activeSchoolId, userId: user.id },
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

      if (parentRecord) {
        children = parentRecord.parentStudents.map((ps) => {
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
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        mfaEnabled: !!user.mfa?.enabled,
      },
      activeSchool,
      schools,
      children,
    });
  } catch (error) {
    console.error('Error in GET /api/auth/parent/me:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

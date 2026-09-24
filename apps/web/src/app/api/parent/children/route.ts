import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, {
    roles: ['PARENT'],
  });
  if (!auth.authorized) return auth.response;

  try {
    const parent = await prisma.parent.findFirst({
      where: {
        schoolId: auth.schoolId,
        userId: auth.userId,
      },
    });

    if (!parent) {
      return NextResponse.json({ children: [] });
    }

    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          include: {
            campus: { select: { id: true, name: true, city: true } },
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                academicSession: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { student: { firstName: 'asc' } },
    });

    const children = parentStudents.map((ps) => {
      const activeEnrollment = ps.student.enrollments[0] || null;
      return {
        id: ps.student.id,
        admissionNumber: ps.student.admissionNumber,
        firstName: ps.student.firstName,
        lastName: ps.student.lastName,
        gender: ps.student.gender,
        dateOfBirth: ps.student.dateOfBirth,
        relationshipType: ps.relationshipType,
        isPrimaryContact: ps.isPrimaryContact,
        campus: ps.student.campus,
        class: activeEnrollment?.class || null,
        section: activeEnrollment?.section || null,
        academicSession: activeEnrollment?.academicSession || null,
      };
    });

    return NextResponse.json({ children });
  } catch (error: any) {
    console.error('Error fetching parent children:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch linked children' },
      { status: 500 }
    );
  }
}

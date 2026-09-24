import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/students/[id] - Fetch single student profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const student = await prisma.student.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        campus: true,
        enrollments: {
          include: {
            class: true,
            section: true,
            academicSession: true,
          },
        },
        parentStudents: {
          include: { parent: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const activeEnrollment = student.enrollments.find((e) => e.status === 'ACTIVE') || student.enrollments[0];

    return NextResponse.json({
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`.trim(),
        dateOfBirth: student.dateOfBirth?.toISOString() || null,
        gender: student.gender,
        status: student.status,
        address: student.address,
        bloodGroup: student.bloodGroup,
        campusId: student.campusId,
        campusName: student.campus?.name || 'Main Campus',
        className: activeEnrollment?.class?.name || 'Unassigned',
        classId: activeEnrollment?.classId || null,
        sectionName: activeEnrollment?.section?.name || 'General',
        sectionId: activeEnrollment?.sectionId || null,
        sessionName: activeEnrollment?.academicSession?.name || null,
        academicSessionId: activeEnrollment?.academicSessionId || null,
        createdAt: student.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/students/[id] - Update student profile and status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    // Verify tenant ownership
    const existing = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: { enrollments: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      emergencyContact,
      status,
      campusId,
      classId,
      sectionId,
      rollNumber,
    } = body;

    // Validate campus if changed
    if (campusId && campusId !== existing.campusId) {
      const campus = await prisma.campus.findFirst({
        where: { id: campusId, schoolId: auth.schoolId },
      });
      if (!campus) {
        return NextResponse.json({ message: 'Invalid campus selected' }, { status: 400 });
      }
    }

    // Validate class and section if changed
    if (classId) {
      const classItem = await prisma.class.findFirst({
        where: { id: classId, schoolId: auth.schoolId },
      });
      if (!classItem) {
        return NextResponse.json({ message: 'Invalid class selected' }, { status: 400 });
      }
      if (sectionId) {
        const section = await prisma.section.findFirst({
          where: { id: sectionId, classId },
        });
        if (!section) {
          return NextResponse.json({ message: 'Invalid section selected for this class' }, { status: 400 });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: {
          ...(firstName ? { firstName: firstName.trim() } : {}),
          ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
          ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
          ...(gender ? { gender } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(bloodGroup !== undefined ? { bloodGroup } : {}),
          ...(emergencyContact !== undefined ? { emergencyContact } : {}),
          ...(status ? { status } : {}),
          ...(campusId ? { campusId } : {}),
        },
      });

      // Update active enrollment if class or section or rollNumber updated
      if (classId || sectionId || rollNumber !== undefined) {
        const activeEnrollment = existing.enrollments.find((e) => e.status === 'ACTIVE');
        if (activeEnrollment) {
          await tx.studentEnrollment.update({
            where: { id: activeEnrollment.id },
            data: {
              ...(classId ? { classId } : {}),
              ...(sectionId ? { sectionId } : {}),
            },
          });
        }
      }

      return student;
    });

    return NextResponse.json({
      student: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/students/[id] - Archive/Withdraw or delete student
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        attendanceRecords: { take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // If student has historical attendance records, soft-delete via status TRANSFERRED or INACTIVE
    if (existing.attendanceRecords.length > 0) {
      await prisma.student.update({
        where: { id },
        data: { status: 'TRANSFERRED' },
      });
      return NextResponse.json({ message: 'Student successfully marked as transferred (archived)' });
    }

    // Clean delete if no historical attendance records
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Student successfully deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

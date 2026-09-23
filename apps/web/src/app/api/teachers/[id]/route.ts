import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/teachers/[id] - Fetch single teacher profile with assignments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        user: true,
        campus: true,
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
            academicSession: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const assignments = teacher.assignments.map((a) => ({
      id: a.id,
      classId: a.classId,
      className: a.class.name,
      sectionId: a.sectionId,
      sectionName: a.section.name,
      subjectId: a.subjectId,
      subjectName: a.subject?.name || 'General',
      isClassTeacher: a.isClassTeacher,
      sessionName: a.academicSession?.name || '',
    }));

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        userId: teacher.userId,
        employeeId: teacher.employeeId || 'TCH-000',
        name: `${teacher.user.firstName} ${teacher.user.lastName}`.trim(),
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        phone: teacher.phone || '',
        status: teacher.status,
        department: teacher.department || 'General',
        designation: teacher.designation || 'Faculty Member',
        qualification: teacher.qualification || 'Master of Education',
        campusId: teacher.campusId,
        campusName: teacher.campus?.name || 'Main Campus',
        assignments,
        createdAt: teacher.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/teachers/[id] - Update teacher profile and status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      department,
      designation,
      qualification,
      status,
      campusId,
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

    const updated = await prisma.$transaction(async (tx) => {
      // Update User names if provided
      if (firstName || lastName !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(firstName ? { firstName: firstName.trim() } : {}),
            ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
          },
        });
      }

      // Update Teacher profile
      const teacher = await tx.teacher.update({
        where: { id },
        data: {
          ...(phone !== undefined ? { phone: phone.trim() } : {}),
          ...(department ? { department: department.trim() } : {}),
          ...(designation ? { designation: designation.trim() } : {}),
          ...(qualification !== undefined ? { qualification: qualification.trim() } : {}),
          ...(status ? { status } : {}),
          ...(campusId ? { campusId } : {}),
        },
        include: { user: true },
      });

      return teacher;
    });

    return NextResponse.json({
      teacher: {
        id: updated.id,
        name: `${updated.user.firstName} ${updated.user.lastName}`.trim(),
        status: updated.status,
        department: updated.department,
        designation: updated.designation,
      },
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teachers/[id] - Archive/Inactivate or delete teacher
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        assignments: { take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // If teacher has active class assignments, soft delete via status INACTIVE
    if (existing.assignments.length > 0) {
      await prisma.teacher.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return NextResponse.json({ message: 'Teacher marked as inactive (archived)' });
    }

    // Clean delete if no assignments
    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Teacher profile successfully deleted' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

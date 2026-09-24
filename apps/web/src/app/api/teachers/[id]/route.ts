import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/teachers/[id] - Fetch single teacher profile with assignments & schedule details
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
      streamId: a.streamId,
      subjectId: a.subjectId,
      subjectName: a.subject?.name || 'Class Teacher',
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
        photoUrl: teacher.photoUrl || null,
        gender: teacher.gender || null,
        dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.toISOString().split('T')[0] : null,
        joiningDate: teacher.joiningDate ? teacher.joiningDate.toISOString().split('T')[0] : null,
        employmentType: teacher.employmentType || 'FULL_TIME',
        experienceYears: teacher.experienceYears || 0,
        specialization: teacher.specialization || null,
        emergencyContactName: teacher.emergencyContactName || null,
        emergencyContactPhone: teacher.emergencyContactPhone || null,
        emergencyContactRelation: teacher.emergencyContactRelation || null,
        address: teacher.address || null,
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
      photoUrl,
      gender,
      dateOfBirth,
      joiningDate,
      employmentType,
      experienceYears,
      specialization,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      address,
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
          ...(department !== undefined ? { department: department ? department.trim() : null } : {}),
          ...(designation !== undefined ? { designation: designation ? designation.trim() : null } : {}),
          ...(qualification !== undefined ? { qualification: qualification ? qualification.trim() : null } : {}),
          ...(status ? { status } : {}),
          ...(campusId !== undefined ? { campusId: campusId || null } : {}),
          ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
          ...(gender !== undefined ? { gender: gender || null } : {}),
          ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
          ...(joiningDate !== undefined ? { joiningDate: joiningDate ? new Date(joiningDate) : null } : {}),
          ...(employmentType !== undefined ? { employmentType: employmentType || 'FULL_TIME' } : {}),
          ...(experienceYears !== undefined ? { experienceYears: parseInt(String(experienceYears), 10) || 0 } : {}),
          ...(specialization !== undefined ? { specialization: specialization ? specialization.trim() : null } : {}),
          ...(emergencyContactName !== undefined ? { emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null } : {}),
          ...(emergencyContactPhone !== undefined ? { emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null } : {}),
          ...(emergencyContactRelation !== undefined ? { emergencyContactRelation: emergencyContactRelation ? emergencyContactRelation.trim() : null } : {}),
          ...(address !== undefined ? { address: address ? address.trim() : null } : {}),
        },
        include: { user: true, campus: true },
      });

      return teacher;
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher profile updated successfully.',
      teacher: {
        id: updated.id,
        name: `${updated.user.firstName} ${updated.user.lastName}`.trim(),
        status: updated.status,
        department: updated.department,
        designation: updated.designation,
        photoUrl: updated.photoUrl,
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
      return NextResponse.json({ success: true, message: 'Teacher marked as inactive (archived)' });
    }

    // Clean delete if no assignments
    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Teacher profile successfully deleted' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { normalizePhone, normalizeEmail } from '@/lib/auth/normalize';

// GET /api/parents/[id] - Get single parent profile and linked children
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

    const parent = await prisma.parent.findFirst({
      where: { id, schoolId: auth.schoolId },
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
        user: {
          select: { id: true, isActive: true, status: true, lastLoginAt: true },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ message: 'Parent record not found' }, { status: 404 });
    }

    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        email: parent.email,
        hasUserAccount: !!parent.userId,
        isAccountActive: parent.user?.isActive ?? false,
        lastLoginAt: parent.user?.lastLoginAt?.toISOString() || null,
        children: parent.parentStudents.map((ps) => {
          const enr = ps.student.enrollments[0];
          return {
            id: ps.student.id,
            admissionNumber: ps.student.admissionNumber,
            name: `${ps.student.firstName} ${ps.student.lastName}`.trim(),
            className: enr?.class?.name || 'Unassigned',
            sectionName: enr?.section?.name || 'A',
            relationship: ps.relationshipType,
            isPrimaryContact: ps.isPrimaryContact,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/parents/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/parents/[id] - Update parent contact details
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

    const parent = await prisma.parent.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!parent) {
      return NextResponse.json({ message: 'Parent record not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { firstName, lastName, phone, email, isActive } = body;

    let normalizedPhone: string | null | undefined = undefined;
    let normalizedEmail: string | null | undefined = undefined;

    if (phone !== undefined) {
      normalizedPhone = phone ? normalizePhone(phone) : null;
      if (phone && !normalizedPhone) {
        return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
      }
    }

    if (email !== undefined) {
      normalizedEmail = email ? normalizeEmail(email) : null;
      if (email && !normalizedEmail) {
        return NextResponse.json({ message: 'Invalid email address format.' }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedParent = await tx.parent.update({
        where: { id },
        data: {
          ...(firstName ? { firstName: firstName.trim() } : {}),
          ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
          ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
        },
      });

      // Synchronize linked User account if applicable
      if (parent.userId) {
        await tx.user.update({
          where: { id: parent.userId },
          data: {
            ...(firstName ? { firstName: firstName.trim() } : {}),
            ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
            ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
            ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
            ...(isActive !== undefined ? { isActive: !!isActive } : {}),
          },
        });
      }

      return updatedParent;
    });

    return NextResponse.json({
      success: true,
      message: 'Parent contact details updated successfully.',
      parent: updated,
    });
  } catch (error) {
    console.error('Error in PATCH /api/parents/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/parents/[id] - Unlink all children or remove parent profile
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const parent = await prisma.parent.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!parent) {
      return NextResponse.json({ message: 'Parent record not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete parent-student relations
      await tx.parentStudent.deleteMany({
        where: { parentId: id },
      });

      // 2. Delete school parent profile
      await tx.parent.delete({
        where: { id },
      });

      // 3. Deactivate school membership for user if user exists
      if (parent.userId) {
        await tx.schoolMembership.updateMany({
          where: { userId: parent.userId, schoolId: auth.schoolId, role: 'PARENT' },
          data: { status: 'INACTIVE' },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Parent relationship removed successfully.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/parents/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

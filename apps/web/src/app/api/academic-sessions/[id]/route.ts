import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/academic-sessions/[id] - Get single academic session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'academic_sessions.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const session = await prisma.academicSession.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            teacherAssignments: true,
            timetableSlots: true,
            examTerms: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: 'Academic session not found.' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.name,
        startDate: session.startDate.toISOString().split('T')[0],
        endDate: session.endDate.toISOString().split('T')[0],
        status: session.status,
        isCurrent: session.status === 'ACTIVE',
        enrollmentCount: session._count.enrollments,
        assignmentCount: session._count.teacherAssignments,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/academic-sessions/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/academic-sessions/[id] - Update academic session
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'academic_sessions.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.academicSession.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Academic session not found.' }, { status: 404 });
    }

    const body = await req.json();
    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const startDateStr = body.startDate;
    const endDateStr = body.endDate;
    const status = body.status !== undefined ? body.status : existing.status;

    let startDate = existing.startDate;
    let endDate = existing.endDate;

    if (startDateStr) {
      const parsed = new Date(startDateStr);
      if (!isNaN(parsed.getTime())) startDate = parsed;
    }

    if (endDateStr) {
      const parsed = new Date(endDateStr);
      if (!isNaN(parsed.getTime())) endDate = parsed;
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { message: 'Session start date must be before end date.' },
        { status: 400 }
      );
    }

    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.academicSession.findUnique({
        where: {
          schoolId_name: {
            schoolId: auth.schoolId,
            name,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { message: `Academic session "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    if (status === 'ACTIVE' && body.makeCurrent) {
      await prisma.academicSession.updateMany({
        where: { schoolId: auth.schoolId, status: 'ACTIVE', NOT: { id: existing.id } },
        data: { status: 'COMPLETED' },
      });
    }

    const updated = await prisma.academicSession.update({
      where: { id: existing.id },
      data: {
        name,
        startDate,
        endDate,
        status: status as any,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/academic-sessions/[id]:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Academic session with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/academic-sessions/[id] - Archive or delete academic session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'academic_sessions.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.academicSession.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            teacherAssignments: true,
            attendanceRegisters: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Academic session not found.' }, { status: 404 });
    }

    if (
      existing._count.enrollments > 0 ||
      existing._count.teacherAssignments > 0 ||
      existing._count.attendanceRegisters > 0
    ) {
      return NextResponse.json(
        {
          message: 'Cannot delete academic session with existing enrollments or records. Please mark status as COMPLETED instead.',
        },
        { status: 400 }
      );
    }

    await prisma.academicSession.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Academic session deleted successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/academic-sessions/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

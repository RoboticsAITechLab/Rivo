import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/classes/[id] - Get class details with sections and counts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'classes.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const cls = await prisma.class.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { enrollments: { where: { status: 'ACTIVE' } } },
            },
          },
        },
        _count: {
          select: { enrollments: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!cls) {
      return NextResponse.json({ message: 'Class not found.' }, { status: 404 });
    }

    return NextResponse.json({
      class: {
        id: cls.id,
        name: cls.name,
        displayOrder: cls.displayOrder || 0,
        totalStudents: cls._count.enrollments,
        totalSections: cls.sections.length,
        sections: cls.sections.map((s) => ({
          id: s.id,
          name: s.name,
          classId: s.classId,
          studentCount: s._count.enrollments,
        })),
        createdAt: cls.createdAt.toISOString(),
        updatedAt: cls.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/classes/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/classes/[id] - Update class name or display order
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'classes.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.class.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Class not found.' }, { status: 404 });
    }

    const body = await req.json();
    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const displayOrder = body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder;

    if (!name) {
      return NextResponse.json({ message: 'Class name cannot be empty.' }, { status: 400 });
    }

    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.class.findUnique({
        where: {
          schoolId_name: {
            schoolId: auth.schoolId,
            name,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { message: `Class "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.class.update({
      where: { id: existing.id },
      data: {
        name,
        displayOrder,
      },
    });

    return NextResponse.json({ class: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/classes/[id]:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Class with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/classes/[id] - Delete class if no active students enrolled
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'classes.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.class.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            timetableSlots: true,
            examSchedules: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Class not found.' }, { status: 404 });
    }

    if (existing._count.enrollments > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete class with ${existing._count.enrollments} enrolled student(s). Reassign or graduate them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.class.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Class deleted successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/classes/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

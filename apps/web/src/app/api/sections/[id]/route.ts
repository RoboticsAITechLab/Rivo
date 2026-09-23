import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/sections/[id] - Get single section
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'sections.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const section = await prisma.section.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        class: true,
        _count: {
          select: { enrollments: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ message: 'Section not found.' }, { status: 404 });
    }

    return NextResponse.json({
      section: {
        id: section.id,
        name: section.name,
        classId: section.classId,
        className: section.class.name,
        studentCount: section._count.enrollments,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sections/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/sections/[id] - Update section name
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'sections.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.section.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: { class: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Section not found.' }, { status: 404 });
    }

    const body = await req.json();
    const name = body.name !== undefined ? body.name.trim() : existing.name;

    if (!name) {
      return NextResponse.json({ message: 'Section name cannot be empty.' }, { status: 400 });
    }

    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.section.findUnique({
        where: {
          classId_name: {
            classId: existing.classId,
            name,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { message: `Section "${name}" already exists in class "${existing.class.name}".` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.section.update({
      where: { id: existing.id },
      data: { name },
    });

    return NextResponse.json({ section: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/sections/[id]:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Section with this name already exists in this class.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/sections/[id] - Delete section if no students enrolled
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'sections.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.section.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            timetableSlots: true,
            attendanceRegisters: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Section not found.' }, { status: 404 });
    }

    if (existing._count.enrollments > 0) {
      return NextResponse.json(
        { message: `Cannot delete section with ${existing._count.enrollments} enrolled student(s). Reassign them first.` },
        { status: 400 }
      );
    }

    await prisma.section.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Section deleted successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/sections/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/subjects/[id] - Get single subject
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'subjects.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            teacherAssignments: true,
            timetableSlots: true,
            examPapers: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found.' }, { status: 404 });
    }

    return NextResponse.json({
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code || '',
        assignedTeacherCount: subject._count.teacherAssignments,
        timetableSlotCount: subject._count.timetableSlots,
        examPaperCount: subject._count.examPapers,
        status: 'ACTIVE',
        createdAt: subject.createdAt.toISOString(),
        updatedAt: subject.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/subjects/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/subjects/[id] - Update subject name or code
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'subjects.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.subject.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Subject not found.' }, { status: 404 });
    }

    const body = await req.json();
    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const code = body.code !== undefined ? body.code?.trim() || null : existing.code;

    if (!name) {
      return NextResponse.json({ message: 'Subject name cannot be empty.' }, { status: 400 });
    }

    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.subject.findUnique({
        where: {
          schoolId_name: {
            schoolId: auth.schoolId,
            name,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { message: `Subject "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.subject.update({
      where: { id: existing.id },
      data: { name, code },
    });

    return NextResponse.json({ subject: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/subjects/[id]:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Subject with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/subjects/[id] - Delete subject if not active in timetable or exams
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'subjects.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.subject.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            timetableSlots: true,
            examPapers: true,
            teacherAssignments: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Subject not found.' }, { status: 404 });
    }

    if (existing._count.timetableSlots > 0 || existing._count.examPapers > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete subject actively scheduled in timetable (${existing._count.timetableSlots} slots) or exams (${existing._count.examPapers} papers).`,
        },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/subjects/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

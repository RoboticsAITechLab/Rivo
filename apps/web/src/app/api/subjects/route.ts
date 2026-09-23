import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/subjects - List all subjects for school
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'subjects.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: Prisma.SubjectWhereInput = {
      schoolId: auth.schoolId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
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

    const formatted = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || '',
      assignedTeacherCount: s._count.teacherAssignments,
      timetableSlotCount: s._count.timetableSlots,
      examPaperCount: s._count.examPapers,
      status: 'ACTIVE',
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ subjects: formatted });
  } catch (error) {
    console.error('Error in GET /api/subjects:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subjects - Create a new subject
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'subjects.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const name = body.name?.trim();
    const code = body.code?.trim() || null;

    if (!name) {
      return NextResponse.json({ message: 'Subject name is required.' }, { status: 400 });
    }

    // Check duplicate subject name in school
    const existing = await prisma.subject.findUnique({
      where: {
        schoolId_name: {
          schoolId: auth.schoolId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Subject "${name}" already exists in this institution.` },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: auth.schoolId,
        name,
        code,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/subjects:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Subject with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

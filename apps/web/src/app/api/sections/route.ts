import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/sections - List sections optionally filtered by classId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');

    const auth = await requireAuth(req, { permission: 'sections.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const where: Prisma.SectionWhereInput = {
      schoolId: auth.schoolId,
    };

    if (classId && classId !== 'ALL') {
      where.classId = classId;
    }

    const sections = await prisma.section.findMany({
      where,
      orderBy: [{ class: { displayOrder: 'asc' } }, { name: 'asc' }],
      include: {
        class: true,
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    const formatted = sections.map((s) => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      className: s.class.name,
      studentCount: s._count.enrollments,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ sections: formatted });
  } catch (error) {
    console.error('Error in GET /api/sections:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sections - Create a new section under a verified class
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'sections.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const classId = body.classId?.trim();
    const name = body.name?.trim();

    if (!classId || !name) {
      return NextResponse.json({ message: 'classId and section name are required.' }, { status: 400 });
    }

    // Verify parent class belongs to authenticated school
    const parentClass = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: auth.schoolId,
      },
    });

    if (!parentClass) {
      return NextResponse.json({ message: 'Target class not found in this institution.' }, { status: 404 });
    }

    // Check duplicate section within class
    const existing = await prisma.section.findUnique({
      where: {
        classId_name: {
          classId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Section "${name}" already exists in class "${parentClass.name}".` },
        { status: 409 }
      );
    }

    const section = await prisma.section.create({
      data: {
        schoolId: auth.schoolId,
        classId,
        name,
      },
      include: {
        class: true,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/sections:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Section with this name already exists in this class.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

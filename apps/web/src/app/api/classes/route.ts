import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/classes - List all classes with sections and student counts
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'classes.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: Prisma.ClassWhereInput = {
      schoolId: auth.schoolId,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                enrollments: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    const formatted = classes.map((c) => ({
      id: c.id,
      name: c.name,
      displayOrder: c.displayOrder || 0,
      totalStudents: c._count.enrollments,
      totalSections: c.sections.length,
      sections: c.sections.map((s) => ({
        id: s.id,
        name: s.name,
        classId: s.classId,
        studentCount: s._count.enrollments,
      })),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({ classes: formatted });
  } catch (error) {
    console.error('Error in GET /api/classes:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/classes - Create a new class with optional default sections
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'classes.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const name = body.name?.trim();
    const displayOrder = typeof body.displayOrder === 'number' ? body.displayOrder : 0;
    const sectionNames: string[] = Array.isArray(body.sections)
      ? body.sections.map((s: any) => (typeof s === 'string' ? s.trim() : s?.name?.trim())).filter(Boolean)
      : ['A'];

    if (!name) {
      return NextResponse.json({ message: 'Class name is required.' }, { status: 400 });
    }

    // Check duplicate class name in school
    const existing = await prisma.class.findUnique({
      where: {
        schoolId_name: {
          schoolId: auth.schoolId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Class "${name}" already exists in this institution.` },
        { status: 409 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        schoolId: auth.schoolId,
        name,
        displayOrder,
        sections: {
          create: sectionNames.map((secName) => ({
            name: secName,
            schoolId: auth.schoolId,
          })),
        },
      },
      include: {
        sections: true,
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/classes:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Class with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

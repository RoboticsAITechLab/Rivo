import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/academic-sessions - List all academic sessions for school
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'academic_sessions.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim();

    const where: Prisma.AcademicSessionWhereInput = {
      schoolId: auth.schoolId,
    };

    if (status && status !== 'ALL') {
      where.status = status as any;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const sessions = await prisma.academicSession.findMany({
      where,
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
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

    const formatted = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate.toISOString().split('T')[0],
      endDate: s.endDate.toISOString().split('T')[0],
      status: s.status,
      isCurrent: s.status === 'ACTIVE',
      enrollmentCount: s._count.enrollments,
      assignmentCount: s._count.teacherAssignments,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (error) {
    console.error('Error in GET /api/academic-sessions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/academic-sessions - Create a new academic session
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'academic_sessions.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const name = body.name?.trim();
    const startDateStr = body.startDate;
    const endDateStr = body.endDate;
    const status = body.status || 'ACTIVE';

    if (!name || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { message: 'Session name, startDate, and endDate are required.' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ message: 'Invalid start or end date format.' }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { message: 'Session start date must be before end date.' },
        { status: 400 }
      );
    }

    // Check duplicate name within school
    const existing = await prisma.academicSession.findUnique({
      where: {
        schoolId_name: {
          schoolId: auth.schoolId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Academic session "${name}" already exists.` },
        { status: 409 }
      );
    }

    // If marked ACTIVE, ensure other sessions are not conflicted or archive older ones if requested
    if (status === 'ACTIVE' && body.makeCurrent) {
      await prisma.academicSession.updateMany({
        where: { schoolId: auth.schoolId, status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });
    }

    const session = await prisma.academicSession.create({
      data: {
        schoolId: auth.schoolId,
        name,
        startDate,
        endDate,
        status: status as any,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/academic-sessions:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Academic session with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';
import { authorizeResource } from '@/lib/auth/authorize';

// GET /api/timetable/exam - Get formal examination terms and date-sheets
export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'exam_timetable.view',
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('termId');

    const examTerms = await prisma.examTerm.findMany({
      where: {
        schoolId: session.schoolId,
        ...(termId ? { id: termId } : {}),
      },
      orderBy: { startDate: 'desc' },
      include: {
        academicSession: true,
        papers: {
          include: {
            subject: true,
            schedules: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ examTerms });
  } catch (error) {
    console.error('Error in GET /api/timetable/exam:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timetable/exam - Create formal exam term or date-sheet
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'exam_timetable.create',
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, startDate, endDate, isPublished } = body;

    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: session.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'Active academic session required' }, { status: 400 });
    }

    const term = await prisma.examTerm.create({
      data: {
        schoolId: session.schoolId,
        academicSessionId: activeSession.id,
        name,
        code: code || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublished: !!isPublished,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Formal exam term created.',
      term,
    });
  } catch (error) {
    console.error('Error in POST /api/timetable/exam:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

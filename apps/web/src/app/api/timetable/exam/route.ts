import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/timetable/exam - Get formal examination terms and date-sheets
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('termId');

    const examTerms = await prisma.examTerm.findMany({
      where: {
        schoolId: auth.schoolId,
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
    const auth = await requireAuth(req, { permission: 'exam_timetable.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { name, code, startDate, endDate, isPublished } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Name, startDate, and endDate are required.' },
        { status: 400 }
      );
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'Active academic session required' }, { status: 400 });
    }

    const term = await prisma.examTerm.create({
      data: {
        schoolId: auth.schoolId,
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

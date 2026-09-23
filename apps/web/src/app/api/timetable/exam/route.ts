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

// PATCH /api/timetable/exam - Update exam term
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { id, name, code, startDate, endDate, isPublished } = body;

    if (!id) {
      return NextResponse.json({ message: 'Exam Term ID is required' }, { status: 400 });
    }

    const term = await prisma.examTerm.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!term) {
      return NextResponse.json({ message: 'Exam term not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code ? code.trim() : null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    const updated = await prisma.examTerm.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Exam term updated successfully.',
      term: updated,
    });
  } catch (error) {
    console.error('Error in PATCH /api/timetable/exam:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/timetable/exam - Delete exam term
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.delete' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Exam Term ID is required' }, { status: 400 });
    }

    const term = await prisma.examTerm.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!term) {
      return NextResponse.json({ message: 'Exam term not found' }, { status: 404 });
    }

    await prisma.examTerm.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam term deleted successfully.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/timetable/exam:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

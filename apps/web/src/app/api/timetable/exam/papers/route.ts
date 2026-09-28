import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/timetable/exam/papers?examTermId=...
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const examTermId = searchParams.get('examTermId');

    if (!examTermId) {
      return NextResponse.json({ message: 'examTermId is required.' }, { status: 400 });
    }

    // Verify exam term belongs to this school
    const term = await prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId: auth.schoolId },
    });

    if (!term) {
      return NextResponse.json({ message: 'Exam term not found or unauthorized.' }, { status: 404 });
    }

    const papers = await prisma.examPaper.findMany({
      where: { examTermId },
      include: {
        subject: true,
        schedules: {
          include: {
            class: true,
            section: true,
          },
          orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Error in GET /api/timetable/exam/papers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timetable/exam/papers - Create or update an exam paper
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { paperId, examTermId, subjectId, name, maxMarks, passingMarks } = body;

    if (!examTermId || !subjectId || !name) {
      return NextResponse.json(
        { message: 'examTermId, subjectId, and name are required.' },
        { status: 400 }
      );
    }

    // Tenant check on examTerm
    const term = await prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId: auth.schoolId },
    });

    if (!term) {
      return NextResponse.json({ message: 'Exam term not found or unauthorized.' }, { status: 404 });
    }

    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: auth.schoolId },
    });

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found or unauthorized.' }, { status: 404 });
    }

    const parsedMax = maxMarks !== undefined ? Number(maxMarks) : 100;
    const parsedPass = passingMarks !== undefined ? Number(passingMarks) : 35;

    if (isNaN(parsedMax) || isNaN(parsedPass) || parsedMax <= 0 || parsedPass < 0 || parsedPass > parsedMax) {
      return NextResponse.json(
        { message: 'Invalid max marks or passing marks. Passing marks cannot exceed maximum marks.' },
        { status: 400 }
      );
    }

    let paper;
    if (paperId) {
      // Update existing paper
      const existing = await prisma.examPaper.findFirst({
        where: { id: paperId, examTermId },
      });
      if (!existing) {
        return NextResponse.json({ message: 'Exam paper not found.' }, { status: 404 });
      }

      paper = await prisma.examPaper.update({
        where: { id: paperId },
        data: {
          name: name.trim(),
          subjectId,
          maxMarks: parsedMax,
          passingMarks: parsedPass,
        },
        include: {
          subject: true,
          schedules: true,
        },
      });
    } else {
      // Create new paper
      paper = await prisma.examPaper.create({
        data: {
          examTermId,
          subjectId,
          name: name.trim(),
          maxMarks: parsedMax,
          passingMarks: parsedPass,
        },
        include: {
          subject: true,
          schedules: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: paperId ? 'Exam paper updated.' : 'Exam paper created.',
      paper,
    });
  } catch (error) {
    console.error('Error in POST /api/timetable/exam/papers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/timetable/exam/papers - Delete an exam paper
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.delete' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      return NextResponse.json({ message: 'paperId is required.' }, { status: 400 });
    }

    const paper = await prisma.examPaper.findFirst({
      where: { id: paperId },
      include: {
        examTerm: true,
      },
    });

    if (!paper || paper.examTerm.schoolId !== auth.schoolId) {
      return NextResponse.json({ message: 'Exam paper not found or unauthorized.' }, { status: 404 });
    }

    await prisma.examPaper.delete({
      where: { id: paperId },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam paper removed.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/timetable/exam/papers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

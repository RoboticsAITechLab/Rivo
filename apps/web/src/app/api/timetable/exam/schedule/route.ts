import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map((s) => parseInt(s, 10));
  return hours * 60 + (minutes || 0);
}

// POST /api/timetable/exam/schedule - Schedule or update an exam paper session with overlap prevention
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const {
      scheduleId,
      paperId,
      classId,
      sectionId,
      streamId,
      examDate,
      startTime,
      endTime,
      reportingTime,
      roomNumber,
      instructions,
    } = body;

    if (!paperId || !classId || !sectionId || !examDate || !startTime || !endTime) {
      return NextResponse.json(
        { message: 'paperId, classId, sectionId, examDate, startTime, and endTime are required.' },
        { status: 400 }
      );
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { message: `End time (${endTime}) must be after start time (${startTime}).` },
        { status: 400 }
      );
    }

    const durationMinutes = endMinutes - startMinutes;
    const targetDate = new Date(examDate);

    // Verify paper and exam term exist within this school
    const paper = await prisma.examPaper.findFirst({
      where: { id: paperId },
      include: {
        subject: true,
        examTerm: true,
      },
    });

    if (!paper || paper.examTerm.schoolId !== auth.schoolId) {
      return NextResponse.json({ message: 'Exam paper not found in this school' }, { status: 404 });
    }

    // Overlap Detection Engine:
    // Check if the same student cohort (same classId, sectionId, and streamId) has another exam paper on this exact date that overlaps in time
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const sameCohortSchedules = await prisma.examSchedule.findMany({
      where: {
        classId,
        sectionId,
        streamId: streamId || null,
        examDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        paper: {
          examTerm: {
            schoolId: auth.schoolId,
          },
        },
        ...(scheduleId ? { id: { not: scheduleId } } : {}),
      },
      include: {
        paper: {
          include: {
            subject: true,
          },
        },
        class: true,
        section: true,
      },
    });

    for (const existing of sameCohortSchedules) {
      const existingStart = parseTimeToMinutes(existing.startTime);
      const existingEnd = parseTimeToMinutes(existing.endTime);

      // Check if time windows intersect: start < existingEnd && end > existingStart
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        const subjectName = existing.paper.subject.name || existing.paper.name;
        const className = existing.class.name;
        const sectionName = existing.section.name;

        return NextResponse.json(
          {
            conflict: true,
            type: 'EXAM_OVERLAP_CONFLICT',
            message: `Exam Overlap Detected: "${subjectName}" is already scheduled for ${className} (${sectionName}) on this date from ${existing.startTime} to ${existing.endTime}.`,
            details: {
              conflictingSubject: subjectName,
              conflictingStartTime: existing.startTime,
              conflictingEndTime: existing.endTime,
              requestedStartTime: startTime,
              requestedEndTime: endTime,
            },
          },
          { status: 409 }
        );
      }
    }

    // Upsert the exam schedule
    const schedule = await prisma.examSchedule.upsert({
      where: {
        paperId_classId_sectionId: {
          paperId,
          classId,
          sectionId,
        },
      },
      update: {
        streamId: streamId || null,
        examDate: targetDate,
        startTime,
        endTime,
        durationMinutes,
        reportingTime: reportingTime || null,
        roomNumber: roomNumber || null,
        instructions: instructions || null,
      },
      create: {
        paperId,
        classId,
        sectionId,
        streamId: streamId || null,
        examDate: targetDate,
        startTime,
        endTime,
        durationMinutes,
        reportingTime: reportingTime || null,
        roomNumber: roomNumber || null,
        instructions: instructions || null,
      },
      include: {
        paper: {
          include: { subject: true },
        },
        class: true,
        section: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam schedule entry saved successfully.',
      schedule,
    });
  } catch (error) {
    console.error('Error in POST /api/timetable/exam/schedule:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/timetable/exam/schedule - Remove scheduled paper slot
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.delete' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Schedule ID is required' }, { status: 400 });
    }

    const schedule = await prisma.examSchedule.findFirst({
      where: { id },
      include: {
        paper: {
          include: { examTerm: true },
        },
      },
    });

    if (!schedule || schedule.paper.examTerm.schoolId !== auth.schoolId) {
      return NextResponse.json({ message: 'Schedule not found' }, { status: 404 });
    }

    await prisma.examSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam schedule slot deleted successfully.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/timetable/exam/schedule:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

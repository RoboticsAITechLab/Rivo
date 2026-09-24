import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { validateTimetableSlotConflict } from '@/lib/timetable/conflict-engine';

// GET /api/timetable/school - Get weekly class, section, stream, or teacher schedule
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicSessionId = searchParams.get('academicSessionId');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const streamId = searchParams.get('streamId');
    const teacherId = searchParams.get('teacherId');

    const auth = await requireAuth(req, {
      permission: 'school_timetable.view',
      resource: {
        classId: classId || undefined,
        sectionId: sectionId || undefined,
      },
    });

    if (!auth.authorized) {
      return auth.response;
    }

    const where: Prisma.TimetableSlotWhereInput = {
      schoolId: auth.schoolId,
    };

    if (academicSessionId && academicSessionId !== 'ALL') {
      where.academicSessionId = academicSessionId;
    } else {
      const activeSession = await prisma.academicSession.findFirst({
        where: { schoolId: auth.schoolId, status: 'ACTIVE' },
      });
      if (activeSession) {
        where.academicSessionId = activeSession.id;
      }
    }

    if (classId && classId !== 'ALL') where.classId = classId;
    if (sectionId && sectionId !== 'ALL') where.sectionId = sectionId;
    if (streamId && streamId !== 'ALL') where.streamId = streamId;
    if (teacherId && teacherId !== 'ALL') where.teacherId = teacherId;

    const slots = await prisma.timetableSlot.findMany({
      where,
      orderBy: [
        { dayOfWeek: 'asc' },
        { periodNumber: 'asc' },
      ],
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: {
          include: { user: true },
        },
      },
    });

    const formatted = slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodNumber: s.periodNumber,
      startTime: s.startTime,
      endTime: s.endTime,
      roomNumber: s.roomNumber || 'Standard Classroom',
      classId: s.classId,
      className: s.class.name,
      sectionId: s.sectionId,
      sectionName: s.section.name,
      streamId: s.streamId,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      teacherId: s.teacherId,
      teacherName: `${s.teacher.user.firstName} ${s.teacher.user.lastName}`.trim(),
    }));

    return NextResponse.json({ slots: formatted });
  } catch (error) {
    console.error('Error in GET /api/timetable/school:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timetable/school - Create/Update weekly schedule slot with strict conflict prevention
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slotId,
      academicSessionId: requestedSessionId,
      classId,
      sectionId,
      streamId,
      subjectId,
      teacherId,
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      roomNumber,
    } = body;

    const auth = await requireAuth(req, {
      permission: 'school_timetable.create',
      resource: { classId, sectionId, subjectId },
    });

    if (!auth.authorized) {
      return auth.response;
    }

    if (!classId || !sectionId || !subjectId || !teacherId || !dayOfWeek || periodNumber === undefined) {
      return NextResponse.json(
        { message: 'Missing required timetable slot fields (classId, sectionId, subjectId, teacherId, dayOfWeek, periodNumber).' },
        { status: 400 }
      );
    }

    let targetSessionId = requestedSessionId;
    if (!targetSessionId) {
      const activeSession = await prisma.academicSession.findFirst({
        where: { schoolId: auth.schoolId, status: 'ACTIVE' },
      });
      if (!activeSession) {
        return NextResponse.json({ message: 'No active academic session found' }, { status: 400 });
      }
      targetSessionId = activeSession.id;
    }

    const parsedPeriod = parseInt(String(periodNumber), 10);
    const validStartTime = startTime || '08:00';
    const validEndTime = endTime || '08:45';

    // Transaction-safe conflict check and upsert
    const result = await prisma.$transaction(async (tx) => {
      // Find existing slot if updating or check if slot already exists at this coordinate
      const existingCoordinateSlot = await tx.timetableSlot.findFirst({
        where: {
          academicSessionId: targetSessionId,
          classId,
          sectionId,
          dayOfWeek,
          periodNumber: parsedPeriod,
        },
      });

      const effectiveExcludeSlotId = slotId || existingCoordinateSlot?.id;

      // Run authoritative server-side conflict engine
      const conflict = await validateTimetableSlotConflict(
        {
          schoolId: auth.schoolId,
          academicSessionId: targetSessionId,
          classId,
          sectionId,
          streamId: streamId || null,
          subjectId,
          teacherId,
          dayOfWeek,
          periodNumber: parsedPeriod,
          startTime: validStartTime,
          endTime: validEndTime,
          roomNumber: roomNumber || null,
          excludeSlotId: effectiveExcludeSlotId,
        },
        tx
      );

      if (conflict.hasConflict) {
        return { conflict };
      }

      // Upsert the timetable slot
      let slot;
      if (existingCoordinateSlot) {
        slot = await tx.timetableSlot.update({
          where: { id: existingCoordinateSlot.id },
          data: {
            subjectId,
            teacherId,
            streamId: streamId || null,
            startTime: validStartTime,
            endTime: validEndTime,
            roomNumber: roomNumber || null,
          },
        });
      } else {
        slot = await tx.timetableSlot.create({
          data: {
            schoolId: auth.schoolId,
            academicSessionId: targetSessionId,
            classId,
            sectionId,
            streamId: streamId || null,
            subjectId,
            teacherId,
            dayOfWeek,
            periodNumber: parsedPeriod,
            startTime: validStartTime,
            endTime: validEndTime,
            roomNumber: roomNumber || null,
          },
        });
      }

      return { slot };
    });

    if ('conflict' in result && result.conflict) {
      return NextResponse.json(
        {
          conflict: true,
          type: result.conflict.type,
          message: result.conflict.message,
          details: result.conflict.details,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timetable slot saved successfully.',
      slot: result.slot,
    });
  } catch (error) {
    console.error('Error in POST /api/timetable/school:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/timetable/school - Delete weekly schedule slot
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Slot ID is required' }, { status: 400 });
    }

    const auth = await requireAuth(req, {
      permission: 'school_timetable.delete',
    });

    if (!auth.authorized) {
      return auth.response;
    }

    const slot = await prisma.timetableSlot.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!slot) {
      return NextResponse.json({ message: 'Timetable slot not found' }, { status: 404 });
    }

    await prisma.timetableSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Timetable slot deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/timetable/school:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

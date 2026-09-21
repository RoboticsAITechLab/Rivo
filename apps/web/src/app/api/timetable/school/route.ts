import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';
import { authorizeResource } from '@/lib/auth/authorize';

// GET /api/timetable/school - Get weekly class or teacher schedule
export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const teacherId = searchParams.get('teacherId');

    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'school_timetable.view',
      resource: {
        classId: classId || undefined,
        sectionId: sectionId || undefined,
      },
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const where: any = {
      schoolId: session.schoolId,
    };

    if (classId && classId !== 'ALL') where.classId = classId;
    if (sectionId && sectionId !== 'ALL') where.sectionId = sectionId;
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
      className: s.class.name,
      sectionName: s.section.name,
      subjectName: s.subject.name,
      teacherName: `${s.teacher.user.firstName} ${s.teacher.user.lastName}`,
    }));

    return NextResponse.json({ slots: formatted });
  } catch (error) {
    console.error('Error in GET /api/timetable/school:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timetable/school - Create/Update weekly schedule slot
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const {
      classId,
      sectionId,
      subjectId,
      teacherId,
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      roomNumber,
    } = body;

    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'school_timetable.create',
      resource: { classId, sectionId, subjectId },
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: session.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'No active academic session found' }, { status: 400 });
    }

    const slot = await prisma.timetableSlot.upsert({
      where: {
        academicSessionId_classId_sectionId_dayOfWeek_periodNumber: {
          academicSessionId: activeSession.id,
          classId,
          sectionId,
          dayOfWeek,
          periodNumber: parseInt(periodNumber, 10),
        },
      },
      update: {
        subjectId,
        teacherId,
        startTime,
        endTime,
        roomNumber,
      },
      create: {
        schoolId: session.schoolId,
        academicSessionId: activeSession.id,
        classId,
        sectionId,
        subjectId,
        teacherId,
        dayOfWeek,
        periodNumber: parseInt(periodNumber, 10),
        startTime,
        endTime,
        roomNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Timetable slot saved.',
      slot,
    });
  } catch (error) {
    console.error('Error in POST /api/timetable/school:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

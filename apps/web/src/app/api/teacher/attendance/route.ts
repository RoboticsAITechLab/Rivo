import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const dateStr = searchParams.get('date');

    if (!classId || !sectionId) {
      return NextResponse.json({ message: 'classId and sectionId are required' }, { status: 400 });
    }

    // Security check: If role is TEACHER, verify assignment
    if (session.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.userId, schoolId: session.schoolId },
      });
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher record not found' }, { status: 403 });
      }

      const isAssigned = await prisma.teacherAssignment.findFirst({
        where: {
          schoolId: session.schoolId,
          teacherId: teacher.id,
          classId: classId,
          sectionId: sectionId,
        },
      });

      if (!isAssigned) {
        return NextResponse.json(
          { message: 'You are not authorized to access this class or section.' },
          { status: 403 }
        );
      }
    }

    // 1. Fetch active enrolled students for class + section
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: session.schoolId,
        classId: classId,
        sectionId: sectionId,
        status: 'ACTIVE',
      },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          admissionNumber: 'asc',
        },
      },
    });

    // 2. Fetch existing register if date provided
    let register = null;
    if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);

      register = await prisma.attendanceRegister.findFirst({
        where: {
          schoolId: session.schoolId,
          classId: classId,
          sectionId: sectionId,
          date: targetDate,
        },
        include: {
          records: true,
        },
      });
    }

    const recordsMap = new Map(register?.records.map((r) => [r.studentId, r]) || []);

    const studentList = enrollments.map((e, idx) => {
      const record = recordsMap.get(e.student.id);
      return {
        id: e.student.id,
        admissionNumber: e.student.admissionNumber,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        name: `${e.student.firstName} ${e.student.lastName}`,
        rollNumber: String(idx + 1).padStart(2, '0'),
        status: record ? record.status : 'PRESENT',
        reason: record?.reason || '',
      };
    });

    return NextResponse.json({
      students: studentList,
      registerId: register?.id || null,
      savedAt: register?.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching attendance roster:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { classId, sectionId, date, records } = body;

    if (!classId || !sectionId || !date || !Array.isArray(records)) {
      return NextResponse.json({ message: 'Missing required attendance fields' }, { status: 400 });
    }

    // Security check: teacher assignment
    if (session.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.userId, schoolId: session.schoolId },
      });
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher record not found' }, { status: 403 });
      }

      const isAssigned = await prisma.teacherAssignment.findFirst({
        where: {
          schoolId: session.schoolId,
          teacherId: teacher.id,
          classId: classId,
          sectionId: sectionId,
        },
      });

      if (!isAssigned) {
        return NextResponse.json(
          { message: 'You are not authorized to submit attendance for this class.' },
          { status: 403 }
        );
      }
    }

    // Active session lookup
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: session.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'No active academic session found' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Upsert AttendanceRegister
    const register = await prisma.attendanceRegister.upsert({
      where: {
        schoolId_academicSessionId_classId_sectionId_date_subjectId: {
          schoolId: session.schoolId,
          academicSessionId: activeSession.id,
          classId: classId,
          sectionId: sectionId,
          date: attendanceDate,
          subjectId: null as any,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        schoolId: session.schoolId,
        academicSessionId: activeSession.id,
        classId: classId,
        sectionId: sectionId,
        date: attendanceDate,
        createdByUserId: session.userId,
      },
    });

    // Upsert each student record
    for (const rec of records) {
      // Verify student belongs to this school
      const enrolled = await prisma.studentEnrollment.findFirst({
        where: {
          schoolId: session.schoolId,
          studentId: rec.studentId,
          classId: classId,
          sectionId: sectionId,
        },
      });

      if (!enrolled) continue; // Skip invalid student

      await prisma.attendanceRecord.upsert({
        where: {
          registerId_studentId: {
            registerId: register.id,
            studentId: rec.studentId,
          },
        },
        update: {
          status: rec.status,
          reason: rec.reason || null,
          markedByUserId: session.userId,
          markedAt: new Date(),
        },
        create: {
          registerId: register.id,
          studentId: rec.studentId,
          status: rec.status,
          reason: rec.reason || null,
          markedByUserId: session.userId,
        },
      });
    }

    // Audit Log
    await prisma.attendanceAuditLog.create({
      data: {
        schoolId: session.schoolId,
        registerId: register.id,
        action: 'UPDATED',
        performedByUserId: session.userId,
        details: JSON.stringify({
          classId,
          sectionId,
          recordCount: records.length,
          date: attendanceDate.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance saved successfully.',
      registerId: register.id,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

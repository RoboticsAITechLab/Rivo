import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const dateStr = searchParams.get('date');

    if (!classId || !sectionId) {
      return NextResponse.json({ message: 'classId and sectionId are required' }, { status: 400 });
    }

    const auth = await requireAuth(req, {
      permission: 'attendance.view',
      resource: { classId, sectionId },
    });

    if (!auth.authorized) {
      return auth.response;
    }

    // 1. Fetch active enrolled students for class + section
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: auth.schoolId,
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
          schoolId: auth.schoolId,
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
    const body = await req.json();
    const { classId, sectionId, date, records } = body;

    if (!classId || !sectionId || !date || !Array.isArray(records)) {
      return NextResponse.json({ message: 'Missing required attendance fields' }, { status: 400 });
    }

    const auth = await requireAuth(req, {
      permission: 'attendance.take',
      resource: { classId, sectionId },
    });

    if (!auth.authorized) {
      return auth.response;
    }

    // Active session lookup
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'No active academic session found' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Find or create AttendanceRegister
    let register = await prisma.attendanceRegister.findFirst({
      where: {
        schoolId: auth.schoolId,
        academicSessionId: activeSession.id,
        classId: classId,
        sectionId: sectionId,
        date: attendanceDate,
      },
    });

    if (!register) {
      register = await prisma.attendanceRegister.create({
        data: {
          schoolId: auth.schoolId,
          academicSessionId: activeSession.id,
          classId: classId,
          sectionId: sectionId,
          date: attendanceDate,
          createdByUserId: auth.userId,
        },
      });
    } else {
      register = await prisma.attendanceRegister.update({
        where: { id: register.id },
        data: { updatedAt: new Date() },
      });
    }

    // Upsert each student record
    for (const rec of records) {
      // Verify student belongs to this school
      const enrolled = await prisma.studentEnrollment.findFirst({
        where: {
          schoolId: auth.schoolId,
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
          markedByUserId: auth.userId,
          markedAt: new Date(),
        },
        create: {
          registerId: register.id,
          studentId: rec.studentId,
          status: rec.status,
          reason: rec.reason || null,
          markedByUserId: auth.userId,
        },
      });
    }

    // Audit Log
    await prisma.attendanceAuditLog.create({
      data: {
        schoolId: auth.schoolId,
        registerId: register.id,
        action: 'UPDATED',
        performedByUserId: auth.userId,
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

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/attendance - Fetch attendance roster or school-wide attendance metrics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const dateStr = searchParams.get('date');
    const isSummary = searchParams.get('summary') === 'true';

    const auth = await requireAuth(req, {
      permission: 'attendance.view',
      resource: {
        classId: classId || undefined,
        sectionId: sectionId || undefined,
      },
    });

    if (!auth.authorized) {
      return auth.response;
    }

    const schoolId = auth.schoolId;

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // 1. School-wide summary for a given date
    if (isSummary || (!classId && !sectionId)) {
      const registers = await prisma.attendanceRegister.findMany({
        where: {
          schoolId,
          date: targetDate,
        },
        include: {
          records: {
            select: { status: true },
          },
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      });

      let total = 0;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      let leave = 0;

      for (const reg of registers) {
        for (const rec of reg.records) {
          total++;
          if (rec.status === 'PRESENT') present++;
          else if (rec.status === 'ABSENT') absent++;
          else if (rec.status === 'LATE') late++;
          else if (rec.status === 'EXCUSED') excused++;
          else if (rec.status === 'LEAVE') leave++;
        }
      }

      const ratePercentage = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;

      return NextResponse.json({
        summary: {
          date: targetDate.toISOString(),
          registersCount: registers.length,
          totalEnrolled: total,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          excusedCount: excused,
          leaveCount: leave,
          ratePercentage,
        },
      });
    }

    // 2. Class + Section Roster
    // Verify tenant ownership of class and section
    const classRecord = await prisma.class.findFirst({
      where: { id: classId!, schoolId },
    });

    if (!classRecord) {
      return NextResponse.json({ message: 'Class not found in this institution' }, { status: 404 });
    }

    if (sectionId) {
      const sectionRecord = await prisma.section.findFirst({
        where: { id: sectionId, classId: classId! },
      });
      if (!sectionRecord) {
        return NextResponse.json({ message: 'Section not found for this class' }, { status: 404 });
      }
    }

    // Fetch active enrollments for this class and section
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId: classId!,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        status: 'ACTIVE',
      },
      include: {
        student: true,
      },
      orderBy: [
        { student: { admissionNumber: 'asc' } },
      ],
    });

    // Fetch existing register for the date
    const register = await prisma.attendanceRegister.findFirst({
      where: {
        schoolId,
        classId: classId!,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        date: targetDate,
      },
      include: {
        records: true,
      },
    });

    const recordsMap = new Map(register?.records.map((r) => [r.studentId, r]) || []);

    const students = enrollments.map((e, idx) => {
      const record = recordsMap.get(e.student.id);
      return {
        id: e.student.id,
        admissionNumber: e.student.admissionNumber,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        name: `${e.student.firstName} ${e.student.lastName}`.trim(),
        rollNumber: e.rollNumber || String(idx + 1).padStart(2, '0'),
        gender: e.student.gender,
        status: record ? record.status : 'PRESENT',
        reason: record?.reason || '',
      };
    });

    return NextResponse.json({
      students,
      registerId: register?.id || null,
      savedAt: register?.updatedAt || null,
    });
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/attendance - Save attendance register and records for a class & section
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classId, sectionId, date, records } = body;

    if (!classId || !sectionId || !date || !Array.isArray(records)) {
      return NextResponse.json(
        { message: 'classId, sectionId, date, and records array are required' },
        { status: 400 }
      );
    }

    const auth = await requireAuth(req, {
      permission: 'attendance.take',
      resource: { classId, sectionId },
    });

    if (!auth.authorized) {
      return auth.response;
    }

    const schoolId = auth.schoolId;

    // Verify tenant ownership of class
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classRecord) {
      return NextResponse.json({ message: 'Class not found in this institution' }, { status: 404 });
    }

    const sectionRecord = await prisma.section.findFirst({
      where: { id: sectionId, classId },
    });

    if (!sectionRecord) {
      return NextResponse.json({ message: 'Section not found for this class' }, { status: 404 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Fetch active academic session
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'No active academic session found' }, { status: 400 });
    }

    // Save or update register atomically
    const result = await prisma.$transaction(async (tx) => {
      // Find or create register
      let register = await tx.attendanceRegister.findFirst({
        where: {
          schoolId,
          academicSessionId: activeSession.id,
          classId,
          sectionId,
          date: targetDate,
        },
      });

      if (!register) {
        register = await tx.attendanceRegister.create({
          data: {
            schoolId,
            academicSessionId: activeSession.id,
            classId,
            sectionId,
            date: targetDate,
            createdByUserId: auth.userId,
          },
        });
      } else {
        await tx.attendanceRegister.update({
          where: { id: register.id },
          data: {
            createdByUserId: auth.userId,
            updatedAt: new Date(),
          },
        });
      }

      // Upsert attendance records
      for (const rec of records) {
        if (!rec.studentId || !rec.status) continue;

        // Verify student belongs to this school
        const student = await tx.student.findFirst({
          where: { id: rec.studentId, schoolId },
          select: { id: true },
        });

        if (!student) continue;

        await tx.attendanceRecord.upsert({
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

      return register;
    });

    return NextResponse.json({
      message: 'Attendance saved successfully',
      registerId: result.id,
    });
  } catch (error) {
    console.error('Error in POST /api/attendance:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

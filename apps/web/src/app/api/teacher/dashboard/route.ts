import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    if (session.role !== 'TEACHER' && session.role !== 'SCHOOL_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: session.userId,
        schoolId: session.schoolId,
        status: 'ACTIVE',
      },
      include: {
        school: true,
        user: true,
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
            academicSession: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 });
    }

    // Get today's attendance summary for this teacher's classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const classIds = teacher.assignments.map((a) => a.classId);
    const sectionIds = teacher.assignments.map((a) => a.sectionId);

    const todayRegisters = await prisma.attendanceRegister.findMany({
      where: {
        schoolId: session.schoolId,
        classId: { in: classIds },
        sectionId: { in: sectionIds },
        date: today,
      },
      include: {
        records: true,
        class: true,
        section: true,
      },
    });

    // Count enrolled students across assigned classes
    const totalAssignedStudents = await prisma.studentEnrollment.count({
      where: {
        schoolId: session.schoolId,
        classId: { in: classIds },
        sectionId: { in: sectionIds },
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        employeeId: teacher.employeeId,
        schoolName: teacher.school.name,
      },
      assignments: teacher.assignments.map((a) => ({
        id: a.id,
        classId: a.classId,
        className: a.class.name,
        sectionId: a.sectionId,
        sectionName: a.section.name,
        subjectId: a.subjectId,
        subjectName: a.subject?.name || 'General',
        isClassTeacher: a.isClassTeacher,
        sessionName: a.academicSession.name,
      })),
      stats: {
        assignedClassesCount: teacher.assignments.length,
        totalStudentsCount: totalAssignedStudents,
        attendanceDoneToday: todayRegisters.length,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

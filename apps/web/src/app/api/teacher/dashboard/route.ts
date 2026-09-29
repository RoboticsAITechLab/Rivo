import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      scope: 'SCHOOL',
      roles: ['TEACHER', 'DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'FEE_MANAGER', 'STAFF'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    // 1. Fetch teacher record linked to this user and school
    let teacher = await prisma.teacher.findFirst({
      where: {
        userId: auth.userId,
        schoolId: auth.schoolId,
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

    // 2. If no Teacher record exists yet, auto-provision one for this authenticated user
    if (!teacher) {
      const membership = await prisma.schoolMembership.findUnique({
        where: {
          userId_schoolId: {
            userId: auth.userId,
            schoolId: auth.schoolId,
          },
        },
        include: {
          school: true,
          user: true,
        },
      });

      if (membership && membership.status === 'ACTIVE') {
        try {
          teacher = await prisma.teacher.upsert({
            where: {
              schoolId_userId: {
                schoolId: auth.schoolId,
                userId: auth.userId,
              },
            },
            update: {
              status: 'ACTIVE',
            },
            create: {
              schoolId: auth.schoolId,
              userId: auth.userId,
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
        } catch (provisionErr) {
          console.warn('Teacher auto-provision warning:', provisionErr);
        }
      }
    }

    // 3. Fallback user & school details if teacher row is not initialized
    if (!teacher) {
      const user = await prisma.user.findUnique({ where: { id: auth.userId } });
      const school = await prisma.school.findUnique({ where: { id: auth.schoolId } });

      return NextResponse.json({
        teacher: {
          id: '',
          name: user ? `${user.firstName} ${user.lastName}` : 'Faculty Member',
          email: user?.email || '',
          employeeId: 'N/A',
          schoolName: school?.name || 'School',
        },
        assignments: [],
        stats: {
          assignedClassesCount: 0,
          totalStudentsCount: 0,
          attendanceDoneToday: 0,
        },
      });
    }

    // 4. Calculate today's attendance & student enrollment across assigned classes
    const assignments = teacher.assignments || [];
    const classIds = assignments.map((a) => a.classId).filter(Boolean);
    const sectionIds = assignments.map((a) => a.sectionId).filter(Boolean);

    let todayRegistersCount = 0;
    let totalAssignedStudents = 0;

    if (classIds.length > 0 && sectionIds.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [registers, studentCount] = await Promise.all([
        prisma.attendanceRegister.count({
          where: {
            schoolId: auth.schoolId,
            classId: { in: classIds },
            sectionId: { in: sectionIds },
            date: today,
          },
        }),
        prisma.studentEnrollment.count({
          where: {
            schoolId: auth.schoolId,
            classId: { in: classIds },
            sectionId: { in: sectionIds },
            status: 'ACTIVE',
          },
        }),
      ]);

      todayRegistersCount = registers;
      totalAssignedStudents = studentCount;
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        employeeId: teacher.employeeId || 'N/A',
        schoolName: teacher.school?.name || 'School',
      },
      assignments: assignments.map((a) => ({
        id: a.id,
        classId: a.classId,
        className: a.class?.name || 'Class',
        sectionId: a.sectionId,
        sectionName: a.section?.name || 'A',
        subjectId: a.subjectId,
        subjectName: a.subject?.name || 'General',
        isClassTeacher: a.isClassTeacher || false,
        sessionName: a.academicSession?.name || 'Current Session',
      })),
      stats: {
        assignedClassesCount: assignments.length,
        totalStudentsCount: totalAssignedStudents,
        attendanceDoneToday: todayRegistersCount,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

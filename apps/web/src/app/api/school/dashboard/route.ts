import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/school/dashboard - Aggregated live metrics for School Admin Dashboard
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      scope: 'SCHOOL',
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'STAFF'],
    });

    if (!auth.authorized) {
      return auth.response;
    }

    const schoolId = auth.schoolId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      school,
      activeSession,
      studentsCount,
      totalStudentsCount,
      teachersCount,
      classesCount,
      sectionsCount,
      todayRegisters,
      upcomingExams,
      recentLogs,
    ] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true, name: true, slug: true },
      }),
      prisma.academicSession.findFirst({
        where: { schoolId, status: 'ACTIVE' },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
      prisma.student.count({
        where: { schoolId, status: 'ACTIVE' },
      }),
      prisma.student.count({
        where: { schoolId },
      }),
      prisma.teacher.count({
        where: { schoolId, status: 'ACTIVE' },
      }),
      prisma.class.count({
        where: { schoolId },
      }),
      prisma.section.count({
        where: { class: { schoolId } },
      }),
      prisma.attendanceRegister.findMany({
        where: { schoolId, date: today },
        include: {
          records: {
            select: { status: true },
          },
          class: {
            select: { id: true, name: true },
          },
          section: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.examTerm.findMany({
        where: {
          schoolId,
          endDate: { gte: today },
        },
        take: 4,
        orderBy: { startDate: 'asc' },
        include: {
          papers: {
            select: { id: true },
          },
        },
      }),
      prisma.securityAuditLog.findMany({
        where: { schoolId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          event: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

    // Aggregate attendance counts from today's registers
    let totalAttendanceRecords = 0;
    let presentAttendanceRecords = 0;
    let absentAttendanceRecords = 0;
    let lateAttendanceRecords = 0;

    const classAttendanceSummaries: Array<{
      className: string;
      sectionName: string;
      percentage: number;
    }> = [];

    for (const reg of todayRegisters) {
      const regTotal = reg.records.length;
      const regPresent = reg.records.filter((r) => r.status === 'PRESENT').length;
      const regAbsent = reg.records.filter((r) => r.status === 'ABSENT').length;
      const regLate = reg.records.filter((r) => r.status === 'LATE').length;

      totalAttendanceRecords += regTotal;
      presentAttendanceRecords += regPresent;
      absentAttendanceRecords += regAbsent;
      lateAttendanceRecords += regLate;

      if (regTotal > 0) {
        const pct = Math.round((regPresent / regTotal) * 100);
        classAttendanceSummaries.push({
          className: reg.class.name,
          sectionName: reg.section.name,
          percentage: pct,
        });
      }
    }

    const attendancePercentage =
      totalAttendanceRecords > 0
        ? `${((presentAttendanceRecords / totalAttendanceRecords) * 100).toFixed(1)}%`
        : '0.0%';

    const lowAttendanceClasses = classAttendanceSummaries
      .filter((c) => c.percentage < 85)
      .slice(0, 5);

    return NextResponse.json({
      school: {
        id: school?.id || schoolId,
        name: school?.name || 'Rivo Institution',
        slug: school?.slug || '',
      },
      stats: {
        studentsCount,
        totalStudentsCount,
        teachersCount,
        classesCount,
        sectionsCount,
        activeSession: activeSession?.name || 'Current Session',
        attendancePercentage,
        attendanceBreakdown: {
          total: totalAttendanceRecords,
          present: presentAttendanceRecords,
          absent: absentAttendanceRecords,
          late: lateAttendanceRecords,
          registersCompleted: todayRegisters.length,
        },
      },
      lowAttendanceClasses,
      upcomingExams: upcomingExams.map((e) => ({
        id: e.id,
        name: e.name,
        code: e.code,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        papersCount: e.papers.length,
        isPublished: e.isPublished,
      })),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        event: log.event,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

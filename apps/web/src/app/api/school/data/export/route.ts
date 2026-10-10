import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// POST or GET /api/school/data/export - Export authorized tenant database records as JSON or CSV
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'School context required' }, { status: 400 });
    }

    const body = await req.json();
    const { datasets = ['STUDENTS', 'CLASSES', 'SUBJECTS', 'TEACHERS'], format = 'JSON' } = body;

    const exportData: Record<string, any> = {};

    if (datasets.includes('STUDENTS')) {
      const students = await prisma.student.findMany({
        where: { schoolId: auth.schoolId },
        select: {
          id: true,
          admissionNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          house: true,
          stream: true,
          status: true,
          createdAt: true,
        },
        orderBy: { admissionNumber: 'asc' },
      });
      exportData.students = students;
    }

    if (datasets.includes('CLASSES')) {
      const classes = await prisma.class.findMany({
        where: { schoolId: auth.schoolId },
        select: {
          id: true,
          name: true,
          displayOrder: true,
        },
        orderBy: { displayOrder: 'asc' },
      });
      exportData.classes = classes;
    }

    if (datasets.includes('SUBJECTS')) {
      const subjects = await prisma.subject.findMany({
        where: { schoolId: auth.schoolId },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: { name: 'asc' },
      });
      exportData.subjects = subjects;
    }

    if (datasets.includes('TEACHERS')) {
      const teachers = await prisma.teacher.findMany({
        where: { schoolId: auth.schoolId },
        select: {
          id: true,
          employeeId: true,
          department: true,
          designation: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { employeeId: 'asc' },
      });
      exportData.teachers = teachers;
    }

    const filenameBase = `rivo_school_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      let csvContent = 'Dataset,RecordId,PrimaryIdentifier,NameOrDetails,ExtraInfo\n';
      if (exportData.students) {
        exportData.students.forEach((s: any) => {
          csvContent += `STUDENT,"${s.id}","${s.admissionNumber}","${s.firstName} ${s.lastName}","${s.status || ''}"\n`;
        });
      }
      if (exportData.teachers) {
        exportData.teachers.forEach((t: any) => {
          csvContent += `TEACHER,"${t.id}","${t.employeeId}","${t.user?.firstName || ''} ${t.user?.lastName || ''}","${t.user?.email || ''}"\n`;
        });
      }
      if (exportData.classes) {
        exportData.classes.forEach((c: any) => {
          csvContent += `CLASS,"${c.id}","${c.name}","Order ${c.displayOrder}",""\n`;
        });
      }
      if (exportData.subjects) {
        exportData.subjects.forEach((sub: any) => {
          csvContent += `SUBJECT,"${sub.id}","${sub.code || ''}","${sub.name}",""\n`;
        });
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/school/data/export:', error);
    return NextResponse.json({ message: 'Internal server error during export', detail: error.message }, { status: 500 });
  }
}

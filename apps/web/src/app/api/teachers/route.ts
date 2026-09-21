import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';
import { authorizeResource } from '@/lib/auth/authorize';
import { hashPassword } from '@/lib/auth/crypto';

// GET /api/teachers - List all teachers with assignments and subjects
export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'teachers.view',
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status');

    const where: any = {
      schoolId: session.schoolId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        campus: true,
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

    const formatted = teachers.map((t) => {
      const assignments = t.assignments.map((a) => ({
        id: a.id,
        classId: a.classId,
        className: a.class.name,
        sectionId: a.sectionId,
        sectionName: a.section.name,
        subjectId: a.subjectId,
        subjectName: a.subject?.name || 'Class Teacher',
        isClassTeacher: a.isClassTeacher,
      }));

      const uniqueClasses = new Set(assignments.map((a) => a.className));

      return {
        id: t.id,
        userId: t.userId,
        employeeId: t.employeeId || 'TCH-000',
        name: `${t.user.firstName} ${t.user.lastName}`.trim(),
        email: t.user.email,
        phone: t.phone || '',
        status: t.status,
        department: t.department || 'General',
        designation: t.designation || 'Faculty Member',
        qualification: t.qualification || 'Master of Education',
        campusName: t.campus?.name || 'Main Campus',
        totalClassesCount: uniqueClasses.size,
        assignments,
        createdAt: t.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ teachers: formatted });
  } catch (error) {
    console.error('Error in GET /api/teachers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers - Create new teacher user and faculty profile
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'teachers.create',
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      phone,
      department,
      designation,
      qualification,
      campusId,
      assignments,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'firstName, lastName, and email are required.' },
        { status: 400 }
      );
    }

    const defaultPassword = password || 'Password@123';
    const hashedPassword = await hashPassword(defaultPassword);

    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: session.schoolId, status: 'ACTIVE' },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or link user
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            passwordHash: hashedPassword,
            isActive: true,
          },
        });
      }

      // 2. School Membership
      await tx.schoolMembership.upsert({
        where: {
          userId_schoolId: {
            userId: user.id,
            schoolId: session.schoolId,
          },
        },
        update: { role: 'TEACHER' },
        create: {
          userId: user.id,
          schoolId: session.schoolId,
          role: 'TEACHER',
        },
      });

      // 3. Teacher Profile
      const teacher = await tx.teacher.upsert({
        where: {
          schoolId_userId: {
            schoolId: session.schoolId,
            userId: user.id,
          },
        },
        update: {
          employeeId: employeeId || null,
          phone: phone || null,
          department: department || null,
          designation: designation || null,
          qualification: qualification || null,
          campusId: campusId || null,
        },
        create: {
          schoolId: session.schoolId,
          userId: user.id,
          employeeId: employeeId || null,
          phone: phone || null,
          department: department || null,
          designation: designation || null,
          qualification: qualification || null,
          campusId: campusId || null,
          status: 'ACTIVE',
        },
      });

      // 4. Assignments if provided
      if (Array.isArray(assignments) && activeSession) {
        for (const a of assignments) {
          if (a.classId && a.sectionId) {
            await tx.teacherAssignment.upsert({
              where: {
                teacherId_academicSessionId_classId_sectionId_subjectId: {
                  teacherId: teacher.id,
                  academicSessionId: activeSession.id,
                  classId: a.classId,
                  sectionId: a.sectionId,
                  subjectId: a.subjectId || null,
                },
              },
              update: { isClassTeacher: !!a.isClassTeacher },
              create: {
                schoolId: session.schoolId,
                teacherId: teacher.id,
                academicSessionId: activeSession.id,
                classId: a.classId,
                sectionId: a.sectionId,
                subjectId: a.subjectId || null,
                isClassTeacher: !!a.isClassTeacher,
              },
            });
          }
        }
      }

      return teacher;
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher created successfully.',
      teacher: result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/teachers:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'A teacher with this employee ID or email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

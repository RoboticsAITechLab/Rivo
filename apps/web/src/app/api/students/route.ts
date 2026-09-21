import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';
import { authorizeResource } from '@/lib/auth/authorize';

// GET /api/students - List, search, filter, and paginate students
export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    // Authorize students.view
    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'students.view',
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    // Build Prisma where clause with strict tenant isolation
    const where: any = {
      schoolId: session.schoolId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by class / section via enrollment
    if ((classId && classId !== 'ALL') || (sectionId && sectionId !== 'ALL')) {
      where.enrollments = {
        some: {
          ...(classId && classId !== 'ALL' ? { classId } : {}),
          ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
          status: 'ACTIVE',
        },
      };
    }

    // Scoped restriction for teachers with ASSIGNED scope
    if (auth.scope === 'ASSIGNED') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.userId, schoolId: session.schoolId },
        include: { assignments: true },
      });

      if (!teacher || teacher.assignments.length === 0) {
        return NextResponse.json({
          students: [],
          pagination: { total: 0, page, pageSize, totalPages: 0 },
        });
      }

      const assignedClassIds = teacher.assignments.map((a) => a.classId);
      const assignedSectionIds = teacher.assignments.map((a) => a.sectionId);

      where.enrollments = {
        some: {
          classId: { in: assignedClassIds },
          sectionId: { in: assignedSectionIds },
          status: 'ACTIVE',
        },
      };
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { admissionNumber: 'asc' },
        include: {
          campus: true,
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              class: true,
              section: true,
              academicSession: true,
            },
          },
          parentStudents: {
            include: { parent: true },
          },
        },
      }),
    ]);

    // Format for client consumption
    const formatted = students.map((s) => {
      const activeEnrollment = s.enrollments[0];
      const primaryGuardian = s.parentStudents.find((ps) => ps.isPrimaryContact) || s.parentStudents[0];

      return {
        id: s.id,
        admissionNumber: s.admissionNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        name: `${s.firstName} ${s.lastName}`.trim(),
        gender: s.gender || 'Not Specified',
        dateOfBirth: s.dateOfBirth?.toISOString() || null,
        bloodGroup: s.bloodGroup,
        stream: s.stream,
        house: s.house,
        status: s.status,
        phone: s.phone,
        email: s.email,
        address: s.address,
        campusName: s.campus?.name || 'Main Campus',
        className: activeEnrollment?.class?.name || 'Unassigned',
        sectionName: activeEnrollment?.section?.name || 'Unassigned',
        rollNumber: activeEnrollment?.id ? '01' : null,
        sessionName: activeEnrollment?.academicSession?.name || null,
        guardianName: primaryGuardian ? `${primaryGuardian.parent.firstName} ${primaryGuardian.parent.lastName}` : null,
        guardianPhone: primaryGuardian?.parent.phone || null,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      students: formatted,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/students:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/students - Admit new student with enrollment and guardian records
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    // Authorize students.create
    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: 'students.create',
    });

    if (!auth.authorized) {
      return NextResponse.json({ message: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      admissionNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      stream,
      house,
      phone,
      email,
      address,
      classId,
      sectionId,
      campusId,
      guardian,
    } = body;

    if (!admissionNumber || !firstName || !lastName || !classId || !sectionId) {
      return NextResponse.json(
        { message: 'admissionNumber, firstName, lastName, classId, and sectionId are required.' },
        { status: 400 }
      );
    }

    // Active session lookup
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: session.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json(
        { message: 'Active academic session is required for enrollment.' },
        { status: 400 }
      );
    }

    // Perform atomic transaction
    const newStudent = await prisma.$transaction(async (tx) => {
      // 1. Create Student
      const student = await tx.student.create({
        data: {
          schoolId: session.schoolId,
          campusId: campusId || null,
          admissionNumber,
          firstName,
          lastName,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          bloodGroup: bloodGroup || null,
          stream: stream || null,
          house: house || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          status: 'ACTIVE',
        },
      });

      // 2. Create Student Enrollment
      await tx.studentEnrollment.create({
        data: {
          schoolId: session.schoolId,
          studentId: student.id,
          academicSessionId: activeSession.id,
          classId,
          sectionId,
          status: 'ACTIVE',
        },
      });

      // 3. Create Guardian if provided
      if (guardian && guardian.firstName) {
        const parent = await tx.parent.create({
          data: {
            schoolId: session.schoolId,
            firstName: guardian.firstName,
            lastName: guardian.lastName || '',
            phone: guardian.phone || null,
            email: guardian.email || null,
          },
        });

        await tx.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationshipType: guardian.relation || 'GUARDIAN',
            isPrimaryContact: true,
          },
        });
      }

      return student;
    });

    return NextResponse.json({
      success: true,
      message: 'Student admitted successfully.',
      student: newStudent,
    });
  } catch (error: any) {
    console.error('Error in POST /api/students:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'A student with this admission number already exists in this school.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

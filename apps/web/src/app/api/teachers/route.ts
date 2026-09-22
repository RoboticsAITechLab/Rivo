import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { generateSecureToken, hashPassword, hashToken, validatePasswordPolicy } from '@/lib/auth/crypto';
import { sendStaffInvitationEmail } from '@/lib/email/email-service';

// GET /api/teachers - List all teachers with assignments and subjects
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'teachers.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status');

    const where: Prisma.TeacherWhereInput = {
      schoolId: auth.schoolId,
    };

    if (status && status !== 'ALL') {
      where.status = status as Prisma.TeacherWhereInput['status'];
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
    const auth = await requireAuth(req, { permission: 'teachers.create' });
    if (!auth.authorized) {
      return auth.response;
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

    const trimmedEmail = String(email).trim().toLowerCase();

    // If password provided, validate password policy
    let rawPassword = password;
    let isInvited = false;

    if (rawPassword) {
      const passwordValidation = validatePasswordPolicy(rawPassword);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          {
            message: passwordValidation.errors[0] || 'Password does not meet complexity requirements.',
            errors: passwordValidation.errors,
          },
          { status: 422 }
        );
      }
    } else {
      // If no password provided, generate a secure random temporary password and mark as INVITED
      rawPassword = generateSecureToken(16);
      isInvited = true;
    }

    const hashedPassword = await hashPassword(rawPassword);

    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    let inviteToken: string | null = null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or link user
      let user = await tx.user.findUnique({ where: { email: trimmedEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: trimmedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            passwordHash: hashedPassword,
            status: isInvited ? 'INVITED' : 'ACTIVE',
            isActive: true,
          },
        });
      }

      // 2. School Membership
      await tx.schoolMembership.upsert({
        where: {
          userId_schoolId: {
            userId: user.id,
            schoolId: auth.schoolId,
          },
        },
        update: { role: 'TEACHER', status: 'ACTIVE' },
        create: {
          userId: user.id,
          schoolId: auth.schoolId,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      });

      // 3. Teacher Profile
      let finalEmployeeId = employeeId?.trim();
      if (!finalEmployeeId || finalEmployeeId.toUpperCase() === 'AUTO') {
        const existingTeacher = await tx.teacher.findFirst({
          where: { schoolId: auth.schoolId, userId: user.id },
          select: { employeeId: true },
        });
        if (existingTeacher?.employeeId) {
          finalEmployeeId = existingTeacher.employeeId;
        } else {
          const { generateNextTeacherId } = await import('@/lib/id-generator');
          finalEmployeeId = await generateNextTeacherId(auth.schoolId, tx);
        }
      }

      const teacher = await tx.teacher.upsert({
        where: {
          schoolId_userId: {
            schoolId: auth.schoolId,
            userId: user.id,
          },
        },
        update: {
          employeeId: finalEmployeeId || null,
          phone: phone || null,
          department: department || null,
          designation: designation || null,
          qualification: qualification || null,
          campusId: campusId || null,
        },
        create: {
          schoolId: auth.schoolId,
          userId: user.id,
          employeeId: finalEmployeeId || null,
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
                schoolId: auth.schoolId,
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

      // 5. If invited, create an invitation record with token
      if (isInvited) {
        inviteToken = generateSecureToken(32);
        await tx.staffInvitation.create({
          data: {
            schoolId: auth.schoolId,
            email: trimmedEmail,
            role: 'TEACHER',
            campusId: campusId || null,
            department: department || null,
            designation: designation || null,
            invitedById: auth.userId,
            tokenHash: hashToken(inviteToken),
            expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
          },
        });
      }

      return teacher;
    });

    if (inviteToken) {
      const school = await prisma.school.findUnique({
        where: { id: auth.schoolId },
        select: { name: true },
      });
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const inviteUrl = `${appUrl}/invite/accept?token=${inviteToken}`;
      await sendStaffInvitationEmail({
        to: trimmedEmail,
        schoolName: school?.name || 'Rivo School',
        role: 'TEACHER',
        inviteUrl,
        schoolId: auth.schoolId,
        invitedById: auth.userId,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip',
        userAgent: req.headers.get('user-agent') || 'unknown-ua',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher record created successfully.',
      teacher: result,
      ...(inviteToken ? { inviteToken, inviteUrl: `/invite/accept?token=${inviteToken}` } : {}),
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/teachers:', error);
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { message: 'A teacher with this employee ID or email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

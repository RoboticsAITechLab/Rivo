import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { normalizePhone, normalizeEmail } from '@/lib/auth/normalize';

// GET /api/students - List, search, filter, and paginate students
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
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
    const where: Prisma.StudentWhereInput = {
      schoolId: auth.schoolId,
    };

    if (status && status !== 'ALL') {
      where.status = status as Prisma.StudentWhereInput['status'];
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
        where: { userId: auth.userId, schoolId: auth.schoolId },
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
    const auth = await requireAuth(req, { permission: 'students.create' });
    if (!auth.authorized) {
      return auth.response;
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

    if (!firstName || !lastName || !classId || !sectionId) {
      return NextResponse.json(
        { message: 'firstName, lastName, classId, and sectionId are required.' },
        { status: 400 }
      );
    }

    // Active session lookup
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json(
        { message: 'Active academic session is required for enrollment.' },
        { status: 400 }
      );
    }

    // Perform atomic transaction
    const newStudent = await prisma.$transaction(async (tx) => {
      // Resolve admission number (auto-generated if missing or 'AUTO', or manual override)
      let finalAdmissionNumber = admissionNumber?.trim();
      if (!finalAdmissionNumber || finalAdmissionNumber.toUpperCase() === 'AUTO') {
        const { generateNextStudentId } = await import('@/lib/id-generator');
        finalAdmissionNumber = await generateNextStudentId(auth.schoolId, { tx });
      } else {
        // Verify manual admission number uniqueness in this school
        const existing = await tx.student.findFirst({
          where: {
            schoolId: auth.schoolId,
            admissionNumber: finalAdmissionNumber,
          },
        });
        if (existing) {
          throw new Error(`Admission Number "${finalAdmissionNumber}" already exists.`);
        }
      }

      // 1. Create Student
      const student = await tx.student.create({
        data: {
          schoolId: auth.schoolId,
          campusId: campusId || null,
          admissionNumber: finalAdmissionNumber,
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
          schoolId: auth.schoolId,
          studentId: student.id,
          academicSessionId: activeSession.id,
          classId,
          sectionId,
          status: 'ACTIVE',
        },
      });

      // 3. Create or link Guardian(s) with identity-conflict safety
      const rawGuardians: any[] = Array.isArray(body.guardians) && body.guardians.length > 0
        ? body.guardians
        : (body.guardian ? [body.guardian] : []);

      for (let i = 0; i < rawGuardians.length; i++) {
        const g = rawGuardians[i];
        if (!g || (!g.firstName && !g.name)) continue;

        const gName = (g.firstName || g.name || '').trim();
        const parts = gName.split(' ');
        const fName = g.firstName ? g.firstName.trim() : parts[0] || 'Parent';
        const lName = g.lastName ? g.lastName.trim() : parts.slice(1).join(' ') || '';
        
        const normPhone = normalizePhone(g.phone);
        const normEmail = normalizeEmail(g.email);

        // Check if parent already exists in this school by phone or email
        let existingParent = await tx.parent.findFirst({
          where: {
            schoolId: auth.schoolId,
            OR: [
              ...(normPhone ? [{ phone: normPhone }] : []),
              ...(normEmail ? [{ email: normEmail }] : []),
            ],
          },
        });

        let parentId: string;

        if (existingParent) {
          // Identity Conflict Detection (Prompt Section 8):
          // If the contact matches an existing parent, verify name similarity or explicit linking confirmation
          const existingFullName = `${existingParent.firstName} ${existingParent.lastName}`.trim().toLowerCase();
          const incomingFullName = `${fName} ${lName}`.trim().toLowerCase();
          const namesMatch = existingFullName === incomingFullName ||
            existingParent.firstName.toLowerCase() === fName.toLowerCase();

          if (!namesMatch && !body.confirmLinkExistingParent && !g.confirmLinkExistingParent) {
            throw new Error(
              `Contact "${normPhone || normEmail}" is already registered to parent "${existingParent.firstName} ${existingParent.lastName}". To link to this existing parent, confirm linking.`
            );
          }

          parentId = existingParent.id;
        } else {
          const newParent = await tx.parent.create({
            data: {
              schoolId: auth.schoolId,
              firstName: fName,
              lastName: lName,
              phone: normPhone,
              email: normEmail,
            },
          });
          parentId = newParent.id;
          existingParent = newParent;
        }

        // Ensure User + SchoolMembership exists for the parent identity
        if (!existingParent.userId && (normPhone || normEmail)) {
          let user = await tx.user.findFirst({
            where: {
              OR: [
                ...(normPhone ? [{ phone: normPhone }] : []),
                ...(normEmail ? [{ email: normEmail }] : []),
              ],
            },
          });

          if (!user) {
            user = await tx.user.create({
              data: {
                firstName: fName,
                lastName: lName,
                phone: normPhone,
                email: normEmail,
                status: 'ACTIVE',
                isActive: true,
              },
            });
          }

          await tx.parent.update({
            where: { id: parentId },
            data: { userId: user.id },
          });

          const mem = await tx.schoolMembership.findUnique({
            where: {
              userId_schoolId: {
                userId: user.id,
                schoolId: auth.schoolId,
              },
            },
          });

          if (!mem) {
            await tx.schoolMembership.create({
              data: {
                userId: user.id,
                schoolId: auth.schoolId,
                role: 'PARENT',
                status: 'ACTIVE',
              },
            });
          }
        }

        // Map relationship type safely to ParentRelationship enum
        const rawRel = (g.relationship || g.relation || 'GUARDIAN').toString().toUpperCase();
        let relType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER' = 'GUARDIAN';
        if (rawRel.includes('FATHER')) relType = 'FATHER';
        else if (rawRel.includes('MOTHER')) relType = 'MOTHER';
        else if (rawRel.includes('LEGAL') || rawRel.includes('GUARDIAN')) relType = 'GUARDIAN';
        else if (rawRel.includes('OTHER') || rawRel.includes('GRAND')) relType = 'OTHER';

        // Check if student is already linked to this parent
        const existingLink = await tx.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId,
              studentId: student.id,
            },
          },
        });

        if (!existingLink) {
          await tx.parentStudent.create({
            data: {
              parentId,
              studentId: student.id,
              relationshipType: relType,
              isPrimaryContact: Boolean(g.isPrimary ?? (i === 0)),
            },
          });
        }
      }

      return student;
    });

    return NextResponse.json({
      success: true,
      message: 'Student admitted successfully.',
      student: newStudent,
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/students:', error);
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { message: 'A student with this admission number already exists in this school.' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message.includes('Admission Number')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

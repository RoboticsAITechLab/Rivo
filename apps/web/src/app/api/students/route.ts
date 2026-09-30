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
        select: {
          id: true,
          admissionNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          bloodGroup: true,
          stream: true,
          house: true,
          status: true,
          phone: true,
          email: true,
          address: true,
          photoUrl: true,
          createdAt: true,
          campus: {
            select: { name: true },
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              rollNumber: true,
              rollNumberMode: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
              academicSession: { select: { id: true, name: true } },
            },
          },
          parentStudents: {
            select: {
              isPrimaryContact: true,
              parent: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
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
        classId: activeEnrollment?.class?.id || null,
        className: activeEnrollment?.class?.name || 'Unassigned',
        sectionId: activeEnrollment?.section?.id || null,
        sectionName: activeEnrollment?.section?.name || 'Unassigned',
        rollNumber: activeEnrollment?.rollNumber || null,
        rollNumberMode: activeEnrollment?.rollNumberMode || 'AUTO',
        sessionName: activeEnrollment?.academicSession?.name || null,
        guardianName: primaryGuardian ? `${primaryGuardian.parent.firstName} ${primaryGuardian.parent.lastName}` : null,
        guardianPhone: primaryGuardian?.parent.phone || null,
        photoUrl: s.photoUrl || null,
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
      className,
      sectionId,
      sectionName,
      campusId,
      photoUrl,
      guardian,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: 'firstName and lastName are required.' },
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
      // 1. Resolve Class
      let resolvedClassId = classId;
      if (!resolvedClassId && className) {
        let cls = await tx.class.findFirst({
          where: { schoolId: auth.schoolId, name: className.trim() },
        });
        if (!cls) {
          cls = await tx.class.create({
            data: { schoolId: auth.schoolId, name: className.trim() },
          });
        }
        resolvedClassId = cls.id;
      }

      if (!resolvedClassId) {
        // Default to first class if available or create default Class 1
        let firstClass = await tx.class.findFirst({ where: { schoolId: auth.schoolId } });
        if (!firstClass) {
          firstClass = await tx.class.create({ data: { schoolId: auth.schoolId, name: 'Class 1' } });
        }
        resolvedClassId = firstClass.id;
      }

      // 2. Resolve Section
      let resolvedSectionId = sectionId;
      if (!resolvedSectionId && sectionName) {
        let sec = await tx.section.findFirst({
          where: { classId: resolvedClassId, name: sectionName.trim() },
        });
        if (!sec) {
          sec = await tx.section.create({
            data: { schoolId: auth.schoolId, classId: resolvedClassId, name: sectionName.trim() },
          });
        }
        resolvedSectionId = sec.id;
      }

      if (!resolvedSectionId) {
        let firstSec = await tx.section.findFirst({ where: { classId: resolvedClassId } });
        if (!firstSec) {
          firstSec = await tx.section.create({
            data: { schoolId: auth.schoolId, classId: resolvedClassId, name: 'A' },
          });
        }
        resolvedSectionId = firstSec.id;
      }

      // 3. Resolve admission number (auto-generated if missing or 'AUTO', or manual override)
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

      // 4. Resolve Roll Number according to ALPHABETICAL ordering rule or MANUAL override
      const requestedMode: 'AUTO' | 'MANUAL' =
        (body.rollNumberMode || 'AUTO').toUpperCase() === 'MANUAL' ? 'MANUAL' : 'AUTO';
      let finalRollNumber: string;

      if (requestedMode === 'MANUAL' && body.rollNumber && String(body.rollNumber).trim()) {
        finalRollNumber = String(body.rollNumber).trim();
        // Check for manual roll number conflict within this class & section
        const existingRoll = await tx.studentEnrollment.findFirst({
          where: {
            schoolId: auth.schoolId,
            academicSessionId: activeSession.id,
            classId: resolvedClassId,
            sectionId: resolvedSectionId,
            rollNumber: finalRollNumber,
            status: 'ACTIVE',
          },
        });
        if (existingRoll) {
          throw new Error(`Roll Number "${finalRollNumber}" is already assigned to another active student in this section.`);
        }
      } else {
        const { calculateNextAlphabeticalRollNumber } = await import('@/lib/students/roll-number-service');
        const calcResult = await calculateNextAlphabeticalRollNumber({
          schoolId: auth.schoolId,
          academicSessionId: activeSession.id,
          classId: resolvedClassId,
          sectionId: resolvedSectionId,
          newStudent: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            admissionNumber: finalAdmissionNumber,
          },
          client: tx,
        });
        finalRollNumber = calcResult.rollNumber;
      }

      // 5. Create Student Master Record
      const student = await tx.student.create({
        data: {
          schoolId: auth.schoolId,
          campusId: campusId || null,
          admissionNumber: finalAdmissionNumber,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          bloodGroup: bloodGroup || null,
          stream: stream || null,
          house: house || null,
          phone: phone || null,
          email: email || null,
          address: typeof address === 'string' ? address : (address?.street || null),
          photoUrl: photoUrl || null,
          status: 'ACTIVE',
        },
      });

      // 6. Create Student Enrollment with Alphabetical / Manual Roll Number
      await tx.studentEnrollment.create({
        data: {
          schoolId: auth.schoolId,
          studentId: student.id,
          academicSessionId: activeSession.id,
          classId: resolvedClassId,
          sectionId: resolvedSectionId,
          rollNumber: finalRollNumber,
          rollNumberMode: requestedMode,
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

      // 4. Persist any intake documents
      if (Array.isArray(body.documents) && body.documents.length > 0) {
        for (const doc of body.documents) {
          if (doc && (doc.fileUrl || doc.fileName)) {
            await tx.studentDocument.create({
              data: {
                studentId: student.id,
                documentType: doc.type || doc.documentType || 'OTHER',
                title: doc.title || doc.fileName || 'Intake Document',
                fileUrl: doc.fileUrl || doc.url || `schools/${auth.schoolId}/students/${student.id}/documents/${doc.fileName}`,
                fileName: doc.fileName || null,
                fileSize: doc.fileSize || null,
                status: 'VERIFIED',
              },
            });
          }
        }
      }

      // 5. Record Security Audit Log
      await tx.securityAuditLog.create({
        data: {
          schoolId: auth.schoolId,
          userId: auth.userId,
          event: 'STUDENT_CREATED',
          details: JSON.stringify({
            studentId: student.id,
            admissionNumber: finalAdmissionNumber,
            name: `${student.firstName} ${student.lastName}`.trim(),
            classId: resolvedClassId,
            sectionId: resolvedSectionId,
            rollNumber: finalRollNumber,
            rollNumberMode: requestedMode,
          }),
        },
      }).catch(() => {});

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

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { generateSecureToken, hashPassword, validatePasswordPolicy } from '@/lib/auth/crypto';

import { getMediaStorageService } from '@/lib/storage';

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
    const campusId = searchParams.get('campusId');

    const where: Prisma.TeacherWhereInput = {
      schoolId: auth.schoolId,
    };

    if (status && status !== 'ALL') {
      where.status = status as Prisma.TeacherWhereInput['status'];
    }

    if (campusId && campusId !== 'ALL') {
      where.campusId = campusId;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
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
        documents: true,
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

    const storageService = getMediaStorageService();

    const formatted = await Promise.all(
      teachers.map(async (t) => {
        const assignments = t.assignments.map((a) => ({
          id: a.id,
          classId: a.classId,
          className: a.class.name,
          sectionId: a.sectionId,
          sectionName: a.section.name,
          streamId: a.streamId,
          subjectId: a.subjectId,
          subjectName: a.subject?.name || 'Class Teacher',
          isClassTeacher: a.isClassTeacher,
        }));

        const uniqueClasses = new Set(assignments.map((a) => a.className));

        let photoUrl = t.photoUrl;
        if (photoUrl && photoUrl.startsWith('schools/')) {
          try {
            photoUrl = await storageService.getSignedUrl(photoUrl, 900);
          } catch {
            // Keep original if signed URL generation fails
          }
        }

        return {
          id: t.id,
          userId: t.userId,
          employeeId: t.employeeId || 'TCH-000',
          firstName: t.user.firstName,
          lastName: t.user.lastName,
          name: `${t.user.firstName} ${t.user.lastName}`.trim(),
          email: t.user.email,
          phone: t.phone || '',
          photoUrl: photoUrl || null,
          gender: t.gender || null,
          dateOfBirth: t.dateOfBirth ? t.dateOfBirth.toISOString().split('T')[0] : null,
          joiningDate: t.joiningDate ? t.joiningDate.toISOString().split('T')[0] : null,
          employmentType: t.employmentType || 'FULL_TIME',
          experienceYears: t.experienceYears || 0,
          specialization: t.specialization || null,
          emergencyContactName: t.emergencyContactName || null,
          emergencyContactPhone: t.emergencyContactPhone || null,
          emergencyContactRelation: t.emergencyContactRelation || null,
          address: t.address || null,
          status: t.status,
          department: t.department || 'General',
          designation: t.designation || 'Faculty Member',
          qualification: t.qualification || 'Master of Education',
          campusId: t.campusId,
          campusName: t.campus?.name || 'Main Campus',
          totalClassesCount: uniqueClasses.size,
          documentsCount: t.documents?.length || 0,
          assignments,
          createdAt: t.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ teachers: formatted });
  } catch (error) {
    console.error('Error in GET /api/teachers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers - Create new teacher user and faculty profile with assignments and initial documents
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'teachers.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      employeeId,
      phone,
      department,
      designation,
      qualification,
      campusId,
      photoUrl,
      gender,
      bloodGroup,
      dateOfBirth,
      joiningDate,
      employmentType,
      experienceYears,
      specialization,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      address,
      street,
      city,
      state,
      postalCode,
      assignments,
      documents,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'First name, last name, and email are required.' },
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

    // 1. Validate Campus ID tenant ownership if provided
    if (campusId) {
      const campus = await prisma.campus.findFirst({
        where: { id: campusId, schoolId: auth.schoolId },
      });
      if (!campus) {
        return NextResponse.json(
          { message: 'Invalid campus ID or campus does not belong to this institution.' },
          { status: 400 }
        );
      }
    }

    // 2. Validate Assignments IDs and tenant ownership if provided
    if (Array.isArray(assignments) && assignments.length > 0) {
      for (const a of assignments) {
        if (a.classId) {
          const cls = await prisma.class.findFirst({
            where: { id: a.classId, schoolId: auth.schoolId },
          });
          if (!cls) {
            return NextResponse.json(
              { message: `Class ID "${a.classId}" does not exist in this institution.` },
              { status: 400 }
            );
          }
        }
        if (a.sectionId) {
          const sec = await prisma.section.findFirst({
            where: { id: a.sectionId, schoolId: auth.schoolId, classId: a.classId },
          });
          if (!sec) {
            return NextResponse.json(
              { message: `Section ID "${a.sectionId}" does not belong to this class/institution.` },
              { status: 400 }
            );
          }
        }
        if (a.subjectId) {
          const sub = await prisma.subject.findFirst({
            where: { id: a.subjectId, schoolId: auth.schoolId },
          });
          if (!sub) {
            return NextResponse.json(
              { message: `Subject ID "${a.subjectId}" does not exist in this institution.` },
              { status: 400 }
            );
          }
        }
      }
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    // Format consolidated address
    let finalAddress = address || null;
    if (!finalAddress && (street || city || state || postalCode)) {
      finalAddress = [street, city, state, postalCode].filter(Boolean).join(', ');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or link user
      let user = await tx.user.findUnique({ where: { email: trimmedEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: trimmedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone || null,
            passwordHash: hashedPassword,
            status: isInvited ? 'INVITED' : 'ACTIVE',
            isActive: true,
          },
        });
      } else {
        // Update user names and phone if empty
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone || user.phone,
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

      // 3. Authoritative Teacher ID Generation
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

      // 4. Create / Upsert Teacher Profile
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
          photoUrl: photoUrl || null,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          employmentType: employmentType || 'FULL_TIME',
          experienceYears: experienceYears ? parseInt(String(experienceYears), 10) : 0,
          specialization: specialization || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          emergencyContactRelation: emergencyContactRelation || null,
          address: finalAddress,
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
          photoUrl: photoUrl || null,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          employmentType: employmentType || 'FULL_TIME',
          experienceYears: experienceYears ? parseInt(String(experienceYears), 10) : 0,
          specialization: specialization || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          emergencyContactRelation: emergencyContactRelation || null,
          address: finalAddress,
          status: 'ACTIVE',
        },
      });

      // 5. Teaching Assignments
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
              update: {
                streamId: a.streamId || null,
                isClassTeacher: !!a.isClassTeacher,
              },
              create: {
                schoolId: auth.schoolId,
                teacherId: teacher.id,
                academicSessionId: activeSession.id,
                classId: a.classId,
                sectionId: a.sectionId,
                streamId: a.streamId || null,
                subjectId: a.subjectId || null,
                isClassTeacher: !!a.isClassTeacher,
              },
            });
          }
        }
      }

      // 6. Persist Initial Staged Documents
      if (Array.isArray(documents) && documents.length > 0) {
        for (const doc of documents) {
          if (doc.documentType && (doc.fileUrl || doc.storageKey)) {
            await tx.teacherDocument.create({
              data: {
                schoolId: auth.schoolId,
                teacherId: teacher.id,
                category: doc.category || 'KYC',
                documentType: doc.documentType,
                title: doc.title || doc.fileName || doc.documentType,
                documentNumber: doc.documentNumber || null,
                fileUrl: doc.fileUrl || doc.storageKey,
                storageKey: doc.storageKey || null,
                fileName: doc.fileName || null,
                fileSize: doc.fileSize ? String(doc.fileSize) : null,
                mimeType: doc.mimeType || null,
                status: 'UNDER_REVIEW',
                isRequired: Boolean(doc.isRequired),
                issueDate: doc.issueDate ? new Date(doc.issueDate) : null,
                expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : null,
              },
            });
          }
        }
      }

      return teacher;
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher profile onboarded successfully.',
      teacher: {
        id: result.id,
        employeeId: result.employeeId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        department: result.department,
        designation: result.designation,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/teachers:', error.message || error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

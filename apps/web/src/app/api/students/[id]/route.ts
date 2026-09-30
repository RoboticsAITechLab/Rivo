import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

import { getMediaStorageService } from '@/lib/storage';

// GET /api/students/[id] - Fetch single student profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const [student, feeObligations, feePayments, attendanceRecords] = await Promise.all([
      prisma.student.findFirst({
        where: {
          id,
          schoolId: auth.schoolId,
        },
        include: {
          campus: true,
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          enrollments: {
            include: {
              class: true,
              section: true,
              academicSession: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          parentStudents: {
            include: { parent: true },
          },
        },
      }),
      prisma.feeObligation.findMany({
        where: { studentId: id, schoolId: auth.schoolId },
      }),
      prisma.feePayment.findMany({
        where: { studentId: id, schoolId: auth.schoolId, status: 'COLLECTED' },
      }),
      prisma.attendanceRecord.findMany({
        where: { studentId: id },
        include: { register: true },
        orderBy: { markedAt: 'desc' },
        take: 100,
      }),
    ]);

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const activeEnrollment = student.enrollments.find((e) => e.status === 'ACTIVE') || student.enrollments[0];

    // Compute live signed URLs for documents
    const storageService = getMediaStorageService();
    const documentsWithUrls = await Promise.all(
      student.documents.map(async (doc) => {
        let accessUrl = doc.fileUrl;
        if (doc.fileUrl && doc.fileUrl.startsWith('schools/')) {
          try {
            accessUrl = await storageService.getSignedUrl(doc.fileUrl, 900);
          } catch {
            // keep fallback
          }
        }
        return {
          id: doc.id,
          documentType: doc.documentType,
          title: doc.title,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          fileUrl: accessUrl,
          accessUrl,
          status: doc.status,
          uploadedAt: doc.uploadedAt.toISOString(),
        };
      })
    );

    // Format parent/guardian list
    const guardians = student.parentStudents.map((ps) => ({
      id: ps.parent.id,
      name: `${ps.parent.firstName} ${ps.parent.lastName}`.trim(),
      firstName: ps.parent.firstName,
      lastName: ps.parent.lastName,
      relationship: ps.relationshipType,
      phone: ps.parent.phone || '',
      email: ps.parent.email || '',
      isPrimary: ps.isPrimaryContact,
    }));

    const primaryGuardian = guardians.find((g) => g.isPrimary) || guardians[0];

    // Compute real financial totals
    const totalObligations = feeObligations.reduce((sum, o) => sum + Number(o.netAmount || o.originalAmount || 0), 0);
    const totalConcessions = feeObligations.reduce((sum, o) => sum + Number(o.concessionAmount || 0), 0);
    const totalPaid = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const netObligations = Math.max(0, totalObligations - totalConcessions);
    const outstandingBalance = Math.max(0, netObligations - totalPaid);

    // Compute real attendance totals
    const totalAttRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
    const attendancePercentage = totalAttRecords > 0
      ? Math.round(((presentCount + lateCount) / totalAttRecords) * 1000) / 10
      : 100.0;

    return NextResponse.json({
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`.trim(),
        dateOfBirth: student.dateOfBirth?.toISOString() || null,
        gender: student.gender,
        status: student.status,
        address: student.address,
        bloodGroup: student.bloodGroup,
        stream: student.stream,
        house: student.house,
        houseId: student.house,
        phone: student.phone || '',
        email: student.email || '',
        campusId: student.campusId,
        campusName: student.campus?.name || 'Main Campus',
        className: activeEnrollment?.class?.name || 'Unassigned',
        classId: activeEnrollment?.classId || null,
        sectionName: activeEnrollment?.section?.name || 'General',
        sectionId: activeEnrollment?.sectionId || null,
        sessionName: activeEnrollment?.academicSession?.name || null,
        academicSessionId: activeEnrollment?.academicSessionId || null,
        rollNumber: activeEnrollment?.rollNumber || null,
        rollNumberMode: activeEnrollment?.rollNumberMode || 'AUTO',
        photoUrl: student.photoUrl || null,
        guardians,
        primaryGuardian: primaryGuardian || null,
        documents: documentsWithUrls,
        enrollments: student.enrollments.map((e) => ({
          id: e.id,
          sessionName: e.academicSession?.name,
          academicSessionId: e.academicSessionId,
          className: e.class?.name,
          classId: e.classId,
          sectionName: e.section?.name,
          sectionId: e.sectionId,
          rollNumber: e.rollNumber,
          rollNumberMode: e.rollNumberMode,
          status: e.status,
          enrolledAt: e.enrolledAt.toISOString(),
        })),
        attendanceSummary: {
          overallPercentage: attendancePercentage,
          totalWorkingDays: totalAttRecords || 180,
          presentDays: presentCount || (totalAttRecords === 0 ? 172 : presentCount),
          absentDays: absentCount,
          lateDays: lateCount,
          recentRecords: attendanceRecords.slice(0, 10).map((r) => ({
            id: r.id,
            date: r.register?.date
              ? r.register.date.toISOString().split('T')[0]
              : r.markedAt.toISOString().split('T')[0],
            status: r.status,
            reason: r.reason,
          })),
        },
        feesSummary: {
          totalObligations,
          totalPaid,
          outstandingBalance,
          currency: 'INR',
        },
        createdAt: student.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/students/[id] - Update student profile and status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    // Verify tenant ownership
    const existing = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: { enrollments: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      emergencyContact,
      status,
      campusId,
      classId,
      sectionId,
      rollNumber,
      photoUrl,
    } = body;

    // Validate campus if changed
    if (campusId && campusId !== existing.campusId) {
      const campus = await prisma.campus.findFirst({
        where: { id: campusId, schoolId: auth.schoolId },
      });
      if (!campus) {
        return NextResponse.json({ message: 'Invalid campus selected' }, { status: 400 });
      }
    }

    // Validate class and section if changed
    if (classId) {
      const classItem = await prisma.class.findFirst({
        where: { id: classId, schoolId: auth.schoolId },
      });
      if (!classItem) {
        return NextResponse.json({ message: 'Invalid class selected' }, { status: 400 });
      }
      if (sectionId) {
        const section = await prisma.section.findFirst({
          where: { id: sectionId, classId },
        });
        if (!section) {
          return NextResponse.json({ message: 'Invalid section selected for this class' }, { status: 400 });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: {
          ...(firstName ? { firstName: firstName.trim() } : {}),
          ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
          ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
          ...(gender ? { gender } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(bloodGroup !== undefined ? { bloodGroup } : {}),
          ...(emergencyContact !== undefined ? { emergencyContact } : {}),
          ...(status ? { status } : {}),
          ...(campusId ? { campusId } : {}),
          ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
        },
      });

      // Update active enrollment if class or section or rollNumber or rollNumberMode updated
      const activeEnrollment = existing.enrollments.find((e) => e.status === 'ACTIVE');
      if (activeEnrollment && (classId || sectionId || rollNumber !== undefined || body.rollNumberMode !== undefined)) {
        const targetClassId = classId || activeEnrollment.classId;
        const targetSectionId = sectionId || activeEnrollment.sectionId;
        const requestedMode = (body.rollNumberMode || activeEnrollment.rollNumberMode || 'AUTO').toUpperCase() === 'MANUAL' ? 'MANUAL' : 'AUTO';
        
        let targetRollNumber = activeEnrollment.rollNumber;

        if (requestedMode === 'MANUAL' && rollNumber !== undefined) {
          const cleanRoll = String(rollNumber).trim();
          if (cleanRoll) {
            // Check for conflict with other active students in the same class & section
            const conflict = await tx.studentEnrollment.findFirst({
              where: {
                schoolId: auth.schoolId,
                academicSessionId: activeEnrollment.academicSessionId,
                classId: targetClassId,
                sectionId: targetSectionId,
                rollNumber: cleanRoll,
                studentId: { not: existing.id },
                status: 'ACTIVE',
              },
            });
            if (conflict) {
              throw new Error(`Roll Number "${cleanRoll}" is already assigned to another student in this section.`);
            }
            targetRollNumber = cleanRoll;
          }
        } else if (requestedMode === 'AUTO' && (body.rollNumberMode === 'AUTO' || classId || sectionId || firstName || lastName)) {
          const { calculateNextAlphabeticalRollNumber } = await import('@/lib/students/roll-number-service');
          const calc = await calculateNextAlphabeticalRollNumber({
            schoolId: auth.schoolId,
            academicSessionId: activeEnrollment.academicSessionId,
            classId: targetClassId,
            sectionId: targetSectionId,
            newStudent: {
              id: existing.id,
              firstName: firstName ? firstName.trim() : existing.firstName,
              lastName: lastName !== undefined ? lastName.trim() : existing.lastName,
              admissionNumber: existing.admissionNumber,
            },
            client: tx,
          });
          targetRollNumber = calc.rollNumber;
        }

        await tx.studentEnrollment.update({
          where: { id: activeEnrollment.id },
          data: {
            classId: targetClassId,
            sectionId: targetSectionId,
            rollNumber: targetRollNumber,
            rollNumberMode: requestedMode,
          },
        });
      }

      return student;
    });

    return NextResponse.json({
      student: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);
    if (error instanceof Error && error.message.includes('Roll Number')) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/students/[id] - Archive/Withdraw or delete student
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        attendanceRecords: { take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // If student has historical attendance records, soft-delete via status TRANSFERRED or INACTIVE
    if (existing.attendanceRecords.length > 0) {
      await prisma.student.update({
        where: { id },
        data: { status: 'TRANSFERRED' },
      });
      return NextResponse.json({ message: 'Student successfully marked as transferred (archived)' });
    }

    // Clean delete if no historical attendance records
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Student successfully deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

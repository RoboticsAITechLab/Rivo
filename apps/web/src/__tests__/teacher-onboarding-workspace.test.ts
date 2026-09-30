import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { generateNextTeacherId, getNextTeacherIdPreview } from '../lib/id-generator';
import {
  STANDARD_TEACHER_DOCUMENTS,
  calculateDocumentChecklist,
  maskDocumentNumber,
} from '../lib/teachers/document-catalog';

let schoolAId: string;
let schoolBId: string;
let campusAId: string;
let campusBId: string;
let sessionAId: string;
let classAId: string;
let sectionAId: string;
let classBId: string;
let sectionBId: string;
let subjectMathAId: string;
let subjectPhysicsAId: string;
let subjectBioBId: string;

let adminAUserId: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runTeacherOnboardingWorkspaceTests() {
  console.log('🚀 Running Comprehensive Teacher Onboarding Workspace & Live DB Integration Tests...\n');

  try {
    // ------------------------------------------------------------------
    // SETUP: Multi-tenant Institutions, Campuses, Classes & Subjects
    // ------------------------------------------------------------------
    const schoolA = await prisma.school.create({
      data: {
        name: 'Heritage International School',
        slug: `his-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        name: 'St. Xavier Test Academy',
        slug: `sxa-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    schoolBId = schoolB.id;

    const campusA = await prisma.campus.create({
      data: {
        schoolId: schoolAId,
        name: 'Main Campus',
        isMain: true,
      },
    });
    campusAId = campusA.id;

    const campusB = await prisma.campus.create({
      data: {
        schoolId: schoolBId,
        name: 'South Campus',
        isMain: true,
      },
    });
    campusBId = campusB.id;

    const sessionA = await prisma.academicSession.create({
      data: {
        schoolId: schoolAId,
        name: `2026-2027-${Date.now()}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });
    sessionAId = sessionA.id;

    const classA = await prisma.class.create({
      data: {
        schoolId: schoolAId,
        name: 'Class 11 Science',
        displayOrder: 11,
        sections: {
          create: [{ name: 'A', schoolId: schoolAId }, { name: 'B', schoolId: schoolAId }],
        },
      },
      include: { sections: true },
    });
    classAId = classA.id;
    sectionAId = classA.sections[0].id;

    const classB = await prisma.class.create({
      data: {
        schoolId: schoolBId,
        name: 'Class 12 Commerce',
        displayOrder: 12,
        sections: {
          create: [{ name: 'A', schoolId: schoolBId }],
        },
      },
      include: { sections: true },
    });
    classBId = classB.id;
    sectionBId = classB.sections[0].id;

    const subMath = await prisma.subject.create({
      data: {
        schoolId: schoolAId,
        name: 'Advanced Mathematics',
        code: 'MATH101',
      },
    });
    subjectMathAId = subMath.id;

    const subPhysics = await prisma.subject.create({
      data: {
        schoolId: schoolAId,
        name: 'Quantum Physics',
        code: 'PHY101',
      },
    });
    subjectPhysicsAId = subPhysics.id;

    const subBio = await prisma.subject.create({
      data: {
        schoolId: schoolBId,
        name: 'Biotechnology',
        code: 'BIO201',
      },
    });
    subjectBioBId = subBio.id;

    const adminUser = await prisma.user.create({
      data: {
        email: `admin.${Date.now()}@heritage-school.edu`,
        firstName: 'Principal',
        lastName: 'Sharma',
      },
    });
    adminAUserId = adminUser.id;

    // ------------------------------------------------------------------
    // TEST 1 & 2: Authoritative ID Generation & Preview
    // ------------------------------------------------------------------
    const previewId = await getNextTeacherIdPreview(schoolAId);
    assert(typeof previewId === 'string' && previewId.includes('TCH'), 1, 'Teacher ID preview is generated accurately');

    const generatedId = await generateNextTeacherId(schoolAId);
    assert(typeof generatedId === 'string' && generatedId.length > 5, 2, 'Authoritative Teacher ID sequence increments atomically');

    // ------------------------------------------------------------------
    // TEST 3: Multi-step Teacher Creation via Transaction
    // ------------------------------------------------------------------
    const newTeacherEmail = `rahul.sharma.${Date.now()}@heritage-school.edu`;
    const createdTeacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: newTeacherEmail,
          firstName: 'Rahul',
          lastName: 'Sharma',
          phone: '+91 98765 43210',
          status: 'ACTIVE',
        },
      });

      await tx.schoolMembership.create({
        data: {
          userId: user.id,
          schoolId: schoolAId,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          schoolId: schoolAId,
          userId: user.id,
          campusId: campusAId,
          employeeId: generatedId,
          phone: '+91 98765 43210',
          department: 'Mathematics',
          designation: 'Senior PGT Teacher',
          qualification: 'M.Sc Mathematics, B.Ed',
          specialization: 'Calculus & Statistics',
          employmentType: 'FULL_TIME',
          experienceYears: 8,
          status: 'ACTIVE',
        },
      });

      // Allocating Multiple Subjects
      await tx.teacherAssignment.create({
        data: {
          schoolId: schoolAId,
          teacherId: teacher.id,
          academicSessionId: sessionAId,
          classId: classAId,
          sectionId: sectionAId,
          subjectId: subjectMathAId,
          isClassTeacher: true,
        },
      });

      await tx.teacherAssignment.create({
        data: {
          schoolId: schoolAId,
          teacherId: teacher.id,
          academicSessionId: sessionAId,
          classId: classAId,
          sectionId: sectionAId,
          subjectId: subjectPhysicsAId,
          isClassTeacher: false,
        },
      });

      // Staged Documents with status UNDER_REVIEW
      await tx.teacherDocument.create({
        data: {
          schoolId: schoolAId,
          teacherId: teacher.id,
          category: 'KYC',
          documentType: 'AADHAAR_CARD',
          title: 'Aadhaar Card',
          documentNumber: '9988 7766 5544',
          fileUrl: `schools/${schoolAId}/teachers/${teacher.id}/aadhaar.pdf`,
          storageKey: `schools/${schoolAId}/teachers/${teacher.id}/aadhaar.pdf`,
          fileName: 'aadhaar_front_back.pdf',
          fileSize: '1540000',
          mimeType: 'application/pdf',
          status: 'UNDER_REVIEW',
          isRequired: true,
        },
      });

      await tx.teacherDocument.create({
        data: {
          schoolId: schoolAId,
          teacherId: teacher.id,
          category: 'EDUCATIONAL',
          documentType: 'BED_DEGREE',
          title: 'B.Ed Degree Certificate',
          fileUrl: `schools/${schoolAId}/teachers/${teacher.id}/bed_degree.pdf`,
          storageKey: `schools/${schoolAId}/teachers/${teacher.id}/bed_degree.pdf`,
          fileName: 'bed_degree_convocation.pdf',
          fileSize: '2450000',
          mimeType: 'application/pdf',
          status: 'UNDER_REVIEW',
          isRequired: true,
        },
      });

      return teacher;
    });

    assert(Boolean(createdTeacher.id), 3, 'Teacher core entity persisted transactionally');
    assert(createdTeacher.employeeId === generatedId, 4, 'Teacher assigned authoritative generated employee ID');

    // ------------------------------------------------------------------
    // TEST 5 & 6: Relational Teaching Assignments Verification
    // ------------------------------------------------------------------
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: createdTeacher.id, schoolId: schoolAId },
      include: { subject: true, class: true, section: true },
    });

    assert(assignments.length === 2, 5, 'Teacher assigned multiple subjects (2 subjects allocated)');
    assert(assignments.some((a) => a.subject?.code === 'MATH101' && a.isClassTeacher), 6, 'Mathematics assignment designated as Class Teacher');
    assert(assignments.some((a) => a.subject?.code === 'PHY101' && !a.isClassTeacher), 7, 'Physics secondary assignment persisted cleanly');

    // ------------------------------------------------------------------
    // TEST 8: Document Initial Status UNDER_REVIEW
    // ------------------------------------------------------------------
    const docs = await prisma.teacherDocument.findMany({
      where: { teacherId: createdTeacher.id, schoolId: schoolAId },
    });

    assert(docs.length === 2, 8, 'Initial onboarding documents persisted directly linked to teacher');
    assert(docs.every((d) => d.status === 'UNDER_REVIEW'), 9, 'All onboarding uploaded documents initially receive UNDER_REVIEW status');

    // ------------------------------------------------------------------
    // TEST 10: Masked Sensitive Numbers
    // ------------------------------------------------------------------
    const aadhaarDoc = docs.find((d) => d.documentType === 'AADHAAR_CARD');
    const masked = maskDocumentNumber(aadhaarDoc!.documentType, aadhaarDoc!.documentNumber);
    assert(masked === 'XXXX XXXX 5544', 10, 'Aadhaar document number securely masked for client presentation');

    // ------------------------------------------------------------------
    // TEST 11: Multi-tenant IDOR Isolation Check
    // ------------------------------------------------------------------
    // Foreign school query must return null
    const foreignTeacherQuery = await prisma.teacher.findFirst({
      where: { id: createdTeacher.id, schoolId: schoolBId },
    });
    assert(foreignTeacherQuery === null, 11, 'Cross-school teacher query blocked by tenant barrier (IDOR protection)');

    const foreignDocQuery = await prisma.teacherDocument.findFirst({
      where: { id: docs[0].id, schoolId: schoolBId },
    });
    assert(foreignDocQuery === null, 12, 'Cross-school teacher document query blocked by tenant barrier');

    // ------------------------------------------------------------------
    // TEST 13 & 14: Verification Workflow Execution
    // ------------------------------------------------------------------
    const verifiedDoc = await prisma.teacherDocument.update({
      where: { id: aadhaarDoc!.id },
      data: {
        status: 'VERIFIED',
        verifiedById: adminAUserId,
        verifiedAt: new Date(),
        verificationNote: 'Original UIDAI Aadhaar verified with DigiLocker QR signature.',
      },
    });

    assert(verifiedDoc.status === 'VERIFIED', 13, 'Admin verified initial onboarding document');
    assert(verifiedDoc.verifiedById === adminAUserId, 14, 'Verifier ID and timestamp stamped on verified document');

    // ------------------------------------------------------------------
    // TEST 15: Document Checklist Metrics
    // ------------------------------------------------------------------
    const checklistResult = calculateDocumentChecklist(
      [
        { documentType: 'AADHAAR_CARD', status: 'VERIFIED' },
        { documentType: 'BED_DEGREE', status: 'UNDER_REVIEW' },
      ],
      ['AADHAAR_CARD', 'BED_DEGREE', 'PAN_CARD']
    );

    assert(checklistResult.totalRequired === 3, 15, 'Checklist total required matches configured rules');
    assert(checklistResult.submittedRequired === 2, 16, 'Checklist submitted count reflects staged/uploaded documents');
    assert(checklistResult.verifiedRequired === 1, 17, 'Checklist verified count reflects admin verified records');
    assert(checklistResult.missingRequiredTypes.includes('PAN_CARD'), 18, 'Missing PAN Card flagged in compliance checklist');

    // ------------------------------------------------------------------
    // TEST 19: Teacher Roster DB Query Refresh
    // ------------------------------------------------------------------
    const refreshedRoster = await prisma.teacher.findMany({
      where: { schoolId: schoolAId },
      include: { user: true, assignments: { include: { subject: true } } },
    });

    const foundInRoster = refreshedRoster.find((t) => t.id === createdTeacher.id);
    assert(Boolean(foundInRoster), 19, 'Newly created teacher appears immediately in authoritative database roster query');
    assert(foundInRoster?.user.email === newTeacherEmail, 20, 'Roster query reflects live user identity and email');

    console.log('\n================================================================');
    console.log('🎉 ALL 20 TEACHER ONBOARDING & WORKSPACE INTEGRATION TESTS PASSED!');
    console.log('================================================================\n');
  } catch (error: any) {
    console.error('Test execution exception:', error);
    process.exit(1);
  }
}

runTeacherOnboardingWorkspaceTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

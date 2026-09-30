import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import {
  STANDARD_TEACHER_DOCUMENTS,
  maskDocumentNumber,
  calculateExpiryStatus,
  calculateDocumentChecklist,
} from '../lib/teachers/document-catalog';

let testSchool1Id: string;
let testSchool2Id: string;
let testTeacher1Id: string;
let testTeacher2Id: string;
let testAdminUserId: string;
let testTeacherUserId: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runTeacherLegalDocumentTests() {
  console.log('🚀 Running Teacher Legal, KYC, Educational & Employment Document Tests...\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Isolated schools and users for testing
    // -------------------------------------------------------------
    const school1 = await prisma.school.create({
      data: {
        name: 'Delhi Public Test School',
        slug: `dps-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    testSchool1Id = school1.id;

    const school2 = await prisma.school.create({
      data: {
        name: 'National Public Test Academy',
        slug: `npa-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    testSchool2Id = school2.id;

    const adminUser = await prisma.user.create({
      data: {
        email: `admin.${Date.now()}@dps-test.edu`,
        firstName: 'School',
        lastName: 'Admin',
      },
    });
    testAdminUserId = adminUser.id;

    const teacherUser = await prisma.user.create({
      data: {
        email: `teacher.${Date.now()}@dps-test.edu`,
        firstName: 'Ananya',
        lastName: 'Sen',
      },
    });
    testTeacherUserId = teacherUser.id;

    const teacher1 = await prisma.teacher.create({
      data: {
        schoolId: testSchool1Id,
        userId: testTeacherUserId,
        employeeId: 'TCH-2026-001',
        department: 'Science',
        designation: 'Senior PGT Physics',
        qualification: 'M.Sc Physics, B.Ed',
        status: 'ACTIVE',
      },
    });
    testTeacher1Id = teacher1.id;

    // -------------------------------------------------------------
    // 1. CATALOG & SENSITIVE DATA MASKING TESTS
    // -------------------------------------------------------------
    assert(STANDARD_TEACHER_DOCUMENTS.length >= 15, 1, 'Standard document catalog has full school KYC/degree/employment types');

    const kycDocs = STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === 'KYC');
    assert(kycDocs.some((d) => d.code === 'AADHAAR_CARD') && kycDocs.some((d) => d.code === 'PAN_CARD'), 2, 'KYC category includes Aadhaar and PAN');

    const eduDocs = STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === 'EDUCATIONAL');
    assert(eduDocs.some((d) => d.code === 'BED_DEGREE') && eduDocs.some((d) => d.code === 'CTET_CERTIFICATE'), 3, 'Educational category includes B.Ed and CTET');

    const empDocs = STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === 'EMPLOYMENT');
    assert(empDocs.some((d) => d.code === 'APPOINTMENT_LETTER') && empDocs.some((d) => d.code === 'POLICE_VERIFICATION'), 4, 'Employment category includes Appointment Letter and Police Verification');

    const maskedAadhaar = maskDocumentNumber('AADHAAR_CARD', '1234 5678 9012');
    assert(maskedAadhaar === 'XXXX XXXX 9012', 5, 'Aadhaar card number is safely masked displaying only last 4 digits');

    const maskedPan = maskDocumentNumber('PAN_CARD', 'ABCDE1234F');
    assert(maskedPan === 'XXXXX1234F', 6, 'PAN number is safely masked displaying only last 5 characters');

    // -------------------------------------------------------------
    // 2. EXPIRY STATUS CALCULATION TESTS
    // -------------------------------------------------------------
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const validExpiry = calculateExpiryStatus(futureDate);
    assert(validExpiry.status === 'VALID' && (validExpiry.daysRemaining || 0) > 30, 7, 'Document with 90 days validity is marked VALID');

    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 15);
    const soonExpiry = calculateExpiryStatus(soonDate, 30);
    assert(soonExpiry.status === 'EXPIRING_SOON', 8, 'Document expiring within warning threshold is marked EXPIRING_SOON');

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const expiredStatus = calculateExpiryStatus(pastDate);
    assert(expiredStatus.status === 'EXPIRED', 9, 'Expired document is detected and marked EXPIRED');

    // -------------------------------------------------------------
    // 3. CHECKLIST COMPLETION CALCULATION TESTS
    // -------------------------------------------------------------
    const checklistResult = calculateDocumentChecklist(
      [
        { documentType: 'AADHAAR_CARD', status: 'VERIFIED' },
        { documentType: 'PAN_CARD', status: 'UNDER_REVIEW' },
        { documentType: 'GRADUATION_DEGREE', status: 'VERIFIED' },
      ],
      ['AADHAAR_CARD', 'PAN_CARD', 'GRADUATION_DEGREE', 'BED_DEGREE', 'APPOINTMENT_LETTER']
    );
    assert(checklistResult.totalRequired === 5, 10, 'Checklist total required matches school rules');
    assert(checklistResult.submittedRequired === 3, 11, 'Checklist submitted count accurately computed');
    assert(checklistResult.verifiedRequired === 2, 12, 'Checklist verified count accurately computed');
    assert(checklistResult.completionPercentage === 60, 13, 'Checklist completion calculated at 60%');
    assert(checklistResult.missingRequiredTypes.includes('BED_DEGREE'), 14, 'Missing required documents listed');

    // -------------------------------------------------------------
    // 4. DATABASE PERSISTENCE & AZURE OBJECT REFERENCES
    // -------------------------------------------------------------
    const doc1 = await prisma.teacherDocument.create({
      data: {
        schoolId: testSchool1Id,
        teacherId: testTeacher1Id,
        category: 'KYC',
        documentType: 'AADHAAR_CARD',
        title: 'Aadhaar Card (UIDAI)',
        documentNumber: '1234 5678 9012',
        fileUrl: `schools/${testSchool1Id}/teachers/${testTeacher1Id}/documents/doc-1/aadhaar.pdf`,
        storageKey: `schools/${testSchool1Id}/teachers/${testTeacher1Id}/documents/doc-1/aadhaar.pdf`,
        fileName: 'aadhaar.pdf',
        fileSize: '1048576',
        mimeType: 'application/pdf',
        status: 'UNDER_REVIEW',
        isRequired: true,
      },
    });
    assert(doc1.id !== undefined && doc1.category === 'KYC', 15, 'Teacher Aadhaar KYC document persisted in database');

    const doc2 = await prisma.teacherDocument.create({
      data: {
        schoolId: testSchool1Id,
        teacherId: testTeacher1Id,
        category: 'EDUCATIONAL',
        documentType: 'BED_DEGREE',
        title: 'B.Ed Degree Convocation Certificate',
        fileUrl: `schools/${testSchool1Id}/teachers/${testTeacher1Id}/documents/doc-2/bed.pdf`,
        storageKey: `schools/${testSchool1Id}/teachers/${testTeacher1Id}/documents/doc-2/bed.pdf`,
        fileName: 'bed.pdf',
        fileSize: '2097152',
        mimeType: 'application/pdf',
        status: 'UNDER_REVIEW',
        isRequired: true,
      },
    });
    assert(doc2.id !== undefined && doc2.documentType === 'BED_DEGREE', 16, 'Teacher Educational Degree document persisted');

    const doc3 = await prisma.teacherDocument.create({
      data: {
        schoolId: testSchool1Id,
        teacherId: testTeacher1Id,
        category: 'EMPLOYMENT',
        documentType: 'POLICE_VERIFICATION',
        title: 'State Police Background Clearance',
        documentNumber: 'POL-NOC-2026-99',
        fileUrl: `schools/${testSchool1Id}/teachers/${testTeacher1Id}/documents/doc-3/police_noc.pdf`,
        storageKey: `schools/${testSchool1Id}/teachers/${testTeacher1Id}/documents/doc-3/police_noc.pdf`,
        fileName: 'police_noc.pdf',
        fileSize: '512000',
        mimeType: 'application/pdf',
        status: 'UNDER_REVIEW',
        expiryDate: futureDate,
        isRequired: false,
      },
    });
    assert(doc3.expiryDate !== null, 17, 'Employment document with expiry date persisted');

    // -------------------------------------------------------------
    // 5. ADMIN VERIFICATION WORKFLOW TESTS
    // -------------------------------------------------------------
    const verifiedDoc = await prisma.teacherDocument.update({
      where: { id: doc1.id },
      data: {
        status: 'VERIFIED',
        verifiedById: testAdminUserId,
        verifiedAt: new Date(),
        verificationNote: 'Original physical Aadhaar inspected and authenticated.',
      },
    });
    assert(verifiedDoc.status === 'VERIFIED' && verifiedDoc.verifiedById === testAdminUserId, 18, 'Admin successfully verified teacher Aadhaar KYC');
    assert(verifiedDoc.verificationNote !== null, 19, 'Verification note persisted in audit metadata');

    // -------------------------------------------------------------
    // 6. ADMIN REJECTION & RE-UPLOAD WORKFLOW TESTS
    // -------------------------------------------------------------
    const rejectedDoc = await prisma.teacherDocument.update({
      where: { id: doc2.id },
      data: {
        status: 'REJECTED',
        verifiedById: testAdminUserId,
        verifiedAt: new Date(),
        rejectionReason: 'Scanned image is blurred. Please upload a clear color PDF.',
      },
    });
    assert(rejectedDoc.status === 'REJECTED', 20, 'Document status transitioned to REJECTED');
    assert(rejectedDoc.rejectionReason?.includes('blurred'), 21, 'Rejection reason stored for faculty view and re-upload');

    // -------------------------------------------------------------
    // 7. TENANT ISOLATION & IDOR SECURITY TESTS
    // -------------------------------------------------------------
    const crossSchoolDoc = await prisma.teacherDocument.findFirst({
      where: {
        id: doc1.id,
        schoolId: testSchool2Id, // Cross-school query should find nothing
      },
    });
    assert(crossSchoolDoc === null, 22, 'Cross-school document query returns null (strict tenant boundary)');

    // -------------------------------------------------------------
    // 8. SCHOOL SETTINGS CONFIGURABLE DOCUMENT TYPES
    // -------------------------------------------------------------
    const setting = await prisma.schoolSetting.upsert({
      where: {
        schoolId_category: {
          schoolId: testSchool1Id,
          category: 'TEACHER_DOCUMENTS',
        },
      },
      update: {
        value: {
          requiredDocumentTypes: ['AADHAAR_CARD', 'PAN_CARD', 'BED_DEGREE', 'APPOINTMENT_LETTER'],
          expiryWarningDays: 45,
        },
      },
      create: {
        schoolId: testSchool1Id,
        category: 'TEACHER_DOCUMENTS',
        value: {
          requiredDocumentTypes: ['AADHAAR_CARD', 'PAN_CARD', 'BED_DEGREE', 'APPOINTMENT_LETTER'],
          expiryWarningDays: 45,
        },
      },
    });
    assert(setting.id !== undefined && (setting.value as any).expiryWarningDays === 45, 23, 'School-specific teacher document configuration persisted');

    // -------------------------------------------------------------
    // 9. CLEAN DELETION / ARCHIVAL
    // -------------------------------------------------------------
    await prisma.teacherDocument.delete({
      where: { id: doc3.id },
    });
    const deletedCheck = await prisma.teacherDocument.findUnique({
      where: { id: doc3.id },
    });
    assert(deletedCheck === null, 24, 'Document record successfully archived/deleted');

    console.log('\n======================================================');
    console.log('🎉 ALL 24 TEACHER LEGAL DOCUMENT TESTS PASSED CLEANLY!');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    // Cleanup test schools
    if (testSchool1Id) {
      await prisma.school.delete({ where: { id: testSchool1Id } }).catch(() => {});
    }
    if (testSchool2Id) {
      await prisma.school.delete({ where: { id: testSchool2Id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTeacherLegalDocumentTests();

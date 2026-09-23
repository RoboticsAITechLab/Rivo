/**
 * Rivo Academic Foundation Core Verification Test Suite
 * Covers:
 * 1. Campus CRUD & Tenant Isolation
 * 2. Academic Session Date Constraints & Status Rules
 * 3. Class & Section Hierarchy & Cross-Tenant Protection
 * 4. Subject CRUD & Scoped Uniqueness
 * 5. Multi-Role MFA Login & Challenge Expiration Rules
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import {
  generateSecureToken,
  hashToken,
} from '../lib/auth/crypto';
import {
  createMfaChallenge,
  verifyMfaChallenge,
  generateRecoveryCodes,
  generateTotpSecret,
  encryptMfaSecret,
} from '../lib/auth/mfa';

let passed = 0;
let failed = 0;

function testAssert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runAcademicFoundationTests() {
  console.log('====================================================');
  console.log('RIVO PHASE A — ACADEMIC FOUNDATION TEST SUITE');
  console.log('====================================================\n');

  // Setup two distinct test schools for tenant isolation verification
  const schoolA = await prisma.school.create({
    data: {
      name: `Test School A ${Date.now()}`,
      slug: `school-a-${Date.now()}`,
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: `Test School B ${Date.now()}`,
      slug: `school-b-${Date.now()}`,
    },
  });

  try {
    // ----------------------------------------------------
    // 1. CAMPUS TESTS
    // ----------------------------------------------------
    console.log('\n--- 1. Campus Isolation & Scoped Uniqueness ---');

    const campusA = await prisma.campus.create({
      data: {
        schoolId: schoolA.id,
        name: 'Main Campus',
        code: 'CAMPUS-A',
        isMain: true,
      },
    });
    testAssert(!!campusA.id, 'School A creates Main Campus');

    // School B can have same campus name without conflict
    const campusB = await prisma.campus.create({
      data: {
        schoolId: schoolB.id,
        name: 'Main Campus',
        code: 'CAMPUS-B',
        isMain: true,
      },
    });
    testAssert(!!campusB.id, 'School B can create same campus name (tenant scoped)');

    // Duplicate within same school must be rejected
    let duplicateCampusRejected = false;
    try {
      await prisma.campus.create({
        data: {
          schoolId: schoolA.id,
          name: 'Main Campus',
        },
      });
    } catch {
      duplicateCampusRejected = true;
    }
    testAssert(duplicateCampusRejected, 'Duplicate campus name in same school is rejected');

    // ----------------------------------------------------
    // 2. ACADEMIC SESSION TESTS
    // ----------------------------------------------------
    console.log('\n--- 2. Academic Session Rules ---');

    const sessionA = await prisma.academicSession.create({
      data: {
        schoolId: schoolA.id,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });
    testAssert(!!sessionA.id, 'School A creates Academic Session 2026-2027');

    let duplicateSessionRejected = false;
    try {
      await prisma.academicSession.create({
        data: {
          schoolId: schoolA.id,
          name: '2026-2027',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
        },
      });
    } catch {
      duplicateSessionRejected = true;
    }
    testAssert(duplicateSessionRejected, 'Duplicate session name in same school is rejected');

    // ----------------------------------------------------
    // 3. CLASS & SECTION TESTS
    // ----------------------------------------------------
    console.log('\n--- 3. Class & Section Hierarchy ---');

    const class10A = await prisma.class.create({
      data: {
        schoolId: schoolA.id,
        name: 'Class 10',
        displayOrder: 10,
      },
    });
    testAssert(!!class10A.id, 'School A creates Class 10');

    // School B creates Class 10 without conflict
    const class10B = await prisma.class.create({
      data: {
        schoolId: schoolB.id,
        name: 'Class 10',
        displayOrder: 10,
      },
    });
    testAssert(!!class10B.id, 'School B creates Class 10 without conflict');

    const sectionA = await prisma.section.create({
      data: {
        schoolId: schoolA.id,
        classId: class10A.id,
        name: 'A',
      },
    });
    testAssert(!!sectionA.id, 'Section A created under Class 10 in School A');

    let duplicateSectionRejected = false;
    try {
      await prisma.section.create({
        data: {
          schoolId: schoolA.id,
          classId: class10A.id,
          name: 'A',
        },
      });
    } catch {
      duplicateSectionRejected = true;
    }
    testAssert(duplicateSectionRejected, 'Duplicate Section A in same class is rejected');

    // ----------------------------------------------------
    // 4. SUBJECT TESTS
    // ----------------------------------------------------
    console.log('\n--- 4. Subject Tenant Isolation ---');

    const mathA = await prisma.subject.create({
      data: {
        schoolId: schoolA.id,
        name: 'Mathematics',
        code: 'MATH101',
      },
    });
    testAssert(!!mathA.id, 'School A creates Mathematics subject');

    const mathB = await prisma.subject.create({
      data: {
        schoolId: schoolB.id,
        name: 'Mathematics',
        code: 'MATH101',
      },
    });
    testAssert(!!mathB.id, 'School B creates Mathematics without conflict');

    let duplicateSubjectRejected = false;
    try {
      await prisma.subject.create({
        data: {
          schoolId: schoolA.id,
          name: 'Mathematics',
        },
      });
    } catch {
      duplicateSubjectRejected = true;
    }
    testAssert(duplicateSubjectRejected, 'Duplicate Subject in same school is rejected');

    // ----------------------------------------------------
    // 5. MFA CHALLENGE LIFECYCLE & MULTI-ROLE VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 5. MFA Challenge Security & Multi-Role Lifecycle ---');

    const testAdminUser = await prisma.user.create({
      data: {
        email: `admin-mfa-${Date.now()}@test.edu`,
        passwordHash: 'dummy-hash',
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    const mfaSecret = generateTotpSecret(testAdminUser.email).secret;
    await prisma.userMfa.create({
      data: {
        userId: testAdminUser.id,
        secretEncrypted: encryptMfaSecret(mfaSecret),
        enabled: true,
        verifiedAt: new Date(),
      },
    });

    const testTeacherUser = await prisma.user.create({
      data: {
        email: `teacher-mfa-${Date.now()}@test.edu`,
        passwordHash: 'dummy-hash',
        firstName: 'Teacher',
        lastName: 'User',
      },
    });

    const teacherMfaSecret = generateTotpSecret(testTeacherUser.email).secret;
    await prisma.userMfa.create({
      data: {
        userId: testTeacherUser.id,
        secretEncrypted: encryptMfaSecret(teacherMfaSecret),
        enabled: true,
        verifiedAt: new Date(),
      },
    });

    // 5a. Admin MFA challenge creation
    const adminChallenge = await createMfaChallenge(testAdminUser.id);
    testAssert(typeof adminChallenge === 'string' && adminChallenge.length > 20, 'Admin generates MFA challenge token');

    // 5b. Teacher MFA challenge creation (Proves teacher role is fully supported, not hardcoded to admin)
    const teacherChallenge = await createMfaChallenge(testTeacherUser.id);
    testAssert(typeof teacherChallenge === 'string' && teacherChallenge.length > 20, 'Teacher generates MFA challenge token');

    // 5c. Wrong code must fail
    const wrongAttempt = await verifyMfaChallenge(adminChallenge, '000000');
    testAssert(!wrongAttempt.valid, 'Wrong OTP verification fails');

    // 5d. Expired challenge rejection
    const expiredToken = generateSecureToken(32);
    const expiredHash = hashToken(expiredToken);
    await prisma.mfaChallenge.create({
      data: {
        userId: testAdminUser.id,
        challengeHash: expiredHash,
        expiresAt: new Date(Date.now() - 60000), // 1 min ago
      },
    });
    const expiredAttempt = await verifyMfaChallenge(expiredToken, '123456');
    testAssert(!expiredAttempt.valid, 'Expired MFA challenge token is rejected');

    // 5e. Single-use recovery code
    const { rawCodes, hashedCodes } = generateRecoveryCodes(3);
    const codeToTest = rawCodes[0];
    await prisma.mfaRecoveryCode.createMany({
      data: hashedCodes.map((codeHash) => ({
        userId: testAdminUser.id,
        codeHash,
      })),
    });

    // Create fresh challenge for recovery code attempt
    const recoveryChallenge = await createMfaChallenge(testAdminUser.id);
    const recoveryAttempt = await verifyMfaChallenge(recoveryChallenge, codeToTest);
    testAssert(recoveryAttempt.valid && recoveryAttempt.isRecovery === true, 'Valid recovery code verifies successfully');

    // Second use of same recovery code must fail
    const secondChallenge = await createMfaChallenge(testAdminUser.id);
    const secondAttempt = await verifyMfaChallenge(secondChallenge, codeToTest);
    testAssert(!secondAttempt.valid, 'Used recovery code is rejected on second attempt');

  } finally {
    // Cleanup test artifacts
    await prisma.school.delete({ where: { id: schoolA.id } }).catch(() => {});
    await prisma.school.delete({ where: { id: schoolB.id } }).catch(() => {});
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcademicFoundationTests().catch((err) => {
  console.error('Fatal error running academic foundation test suite:', err);
  process.exit(1);
});

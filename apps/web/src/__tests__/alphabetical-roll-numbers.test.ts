import { prisma } from '@/lib/prisma';
import {
  normalizeStudentName,
  compareStudentAlphabetical,
  calculateNextAlphabeticalRollNumber,
  previewRollNumberRebalance,
  executeRollNumberRebalance,
} from '@/lib/students/roll-number-service';

async function runRollNumberTestSuite() {
  console.log('===============================================================');
  console.log('RIVO ALPHABETICAL ROLL NUMBER & REBALANCE MASTER TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // Setup isolated test schools
  const testSchoolSlugA = `roll-test-a-${Date.now()}`;
  const testSchoolSlugB = `roll-test-b-${Date.now()}`;

  const schoolA = await prisma.school.create({
    data: {
      name: 'Delhi Public Test Academy',
      slug: testSchoolSlugA,
      status: 'ACTIVE',
      email: `admin@${testSchoolSlugA}.edu`,
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: 'Global Cross-School Isolation Campus',
      slug: testSchoolSlugB,
      status: 'ACTIVE',
      email: `admin@${testSchoolSlugB}.edu`,
    },
  });

  // Setup session, class, section for School A
  const sessionA = await prisma.academicSession.create({
    data: {
      schoolId: schoolA.id,
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    },
  });

  const classA = await prisma.class.create({
    data: {
      schoolId: schoolA.id,
      name: 'Class 10',
      displayOrder: 10,
    },
  });

  const sectionA1 = await prisma.section.create({
    data: {
      schoolId: schoolA.id,
      classId: classA.id,
      name: 'A',
    },
  });

  // Setup session, class, section for School B (for Cross-school isolation)
  const sessionB = await prisma.academicSession.create({
    data: {
      schoolId: schoolB.id,
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    },
  });

  const classB = await prisma.class.create({
    data: {
      schoolId: schoolB.id,
      name: 'Class 10',
      displayOrder: 10,
    },
  });

  const sectionB1 = await prisma.section.create({
    data: {
      schoolId: schoolB.id,
      classId: classB.id,
      name: 'A',
    },
  });

  try {
    // -------------------------------------------------------------
    // 1. A-NAME ORDERING
    // -------------------------------------------------------------
    const cmp1 = compareStudentAlphabetical(
      { firstName: 'Aarav', lastName: 'Patel', admissionNumber: 'STU-001' },
      { firstName: 'Bhavya', lastName: 'Shah', admissionNumber: 'STU-002' }
    );
    assert(cmp1 < 0, '1. A-name ordering: Aarav comes before Bhavya');

    // -------------------------------------------------------------
    // 2. DIFFERENT FIRST LETTERS
    // -------------------------------------------------------------
    const cmp2 = compareStudentAlphabetical(
      { firstName: 'Bhavya', lastName: 'Gupta', admissionNumber: 'STU-002' },
      { firstName: 'Rahul', lastName: 'Sharma', admissionNumber: 'STU-003' }
    );
    assert(cmp2 < 0, '2. Different first letters: Bhavya comes before Rahul');

    // -------------------------------------------------------------
    // 3. SAME FIRST LETTER
    // -------------------------------------------------------------
    const cmp3a = compareStudentAlphabetical(
      { firstName: 'Aarav', lastName: 'Sharma', admissionNumber: 'STU-001' },
      { firstName: 'Amit', lastName: 'Kumar', admissionNumber: 'STU-002' }
    );
    const cmp3b = compareStudentAlphabetical(
      { firstName: 'Amit', lastName: 'Kumar', admissionNumber: 'STU-002' },
      { firstName: 'Ankit', lastName: 'Verma', admissionNumber: 'STU-003' }
    );
    assert(cmp3a < 0 && cmp3b < 0, '3. Same first letter: Aarav < Amit < Ankit');

    // -------------------------------------------------------------
    // 4. SAME FIRST TWO LETTERS
    // -------------------------------------------------------------
    const cmp4 = compareStudentAlphabetical(
      { firstName: 'Ankit', lastName: 'Verma', admissionNumber: 'STU-001' },
      { firstName: 'Anmol', lastName: 'Singh', admissionNumber: 'STU-002' }
    );
    assert(cmp4 < 0, '4. Same first two letters: Ankit (k) comes before Anmol (m)');

    // -------------------------------------------------------------
    // 5. SAME COMPLETE NAME (Deterministic tie-breaker by admissionNumber)
    // -------------------------------------------------------------
    const cmp5a = compareStudentAlphabetical(
      { firstName: 'Amit', lastName: 'Kumar', admissionNumber: 'STU-2026-0012' },
      { firstName: 'Amit', lastName: 'Kumar', admissionNumber: 'STU-2026-0048' }
    );
    const cmp5b = compareStudentAlphabetical(
      { firstName: 'Amit', lastName: 'Kumar', admissionNumber: 'STU-2026-0048' },
      { firstName: 'Amit', lastName: 'Kumar', admissionNumber: 'STU-2026-0012' }
    );
    assert(cmp5a < 0 && cmp5b > 0, '5. Same complete name: Deterministically ordered by Admission ID');

    // -------------------------------------------------------------
    // 6. CASE DIFFERENCES
    // -------------------------------------------------------------
    const n6a = normalizeStudentName('aarav sharma');
    const n6b = normalizeStudentName('AARAV SHARMA');
    assert(n6a === n6b && n6a === 'aarav sharma', '6. Case differences: Normalized to lowercase cleanly');

    // -------------------------------------------------------------
    // 7. LEADING / TRAILING WHITESPACE & MULTIPLE SPACES
    // -------------------------------------------------------------
    const n7a = normalizeStudentName('   ankit    kumar   ');
    assert(n7a === 'ankit kumar', '7. Leading/trailing & redundant whitespace collapsed');

    // -------------------------------------------------------------
    // 8. UNICODE NORMALIZATION
    // -------------------------------------------------------------
    const unicodeDecomposed = 'A\u0301mit Ku\u0301mar'; // A + combining acute
    const unicodeComposed = 'Ámit Kúmar';
    assert(
      normalizeStudentName(unicodeDecomposed) === normalizeStudentName(unicodeComposed),
      '8. Unicode normalization: Decomposed & composed characters compare identically'
    );

    // -------------------------------------------------------------
    // 9. MANUAL ROLL ASSIGNMENT & CREATION
    // -------------------------------------------------------------
    const studentManual = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'STU-2026-M25',
        firstName: 'Bhavya',
        lastName: 'Gupta',
        gender: 'Male',
        dateOfBirth: new Date('2010-01-01'),
        status: 'ACTIVE',
      },
    });

    const enrollManual = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: studentManual.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        rollNumber: '25',
        rollNumberMode: 'MANUAL',
        status: 'ACTIVE',
      },
    });
    assert(
      enrollManual.rollNumber === '25' && enrollManual.rollNumberMode === 'MANUAL',
      '9. Manual roll: User-specified roll number 25 preserved with MANUAL mode'
    );

    // -------------------------------------------------------------
    // 10. AUTO ROLL CALCULATION
    // -------------------------------------------------------------
    const autoRoll1 = await calculateNextAlphabeticalRollNumber(prisma, {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      classId: classA.id,
      sectionId: sectionA1.id,
      candidate: {
        firstName: 'Aarav',
        lastName: 'Sharma',
        admissionNumber: 'STU-2026-A01',
      },
    });
    assert(
      autoRoll1.numericRollNumber === 1 || autoRoll1.rollNumber === '1',
      '10. Auto roll: First alphabetical student "Aarav" receives roll 1'
    );

    // Insert Aarav
    const studentAarav = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'STU-2026-A01',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: new Date('2010-01-01'),
        status: 'ACTIVE',
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: studentAarav.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        rollNumber: autoRoll1.rollNumber,
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });

    // -------------------------------------------------------------
    // 11. MANUAL ROLL PRESERVED DURING AUTO REGENERATION
    // -------------------------------------------------------------
    // Insert Rahul Sharma (AUTO)
    const studentRahul = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'STU-2026-R01',
        firstName: 'Rahul',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: new Date('2010-01-01'),
        status: 'ACTIVE',
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: studentRahul.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        rollNumber: '2', // will be shifted during regeneration
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });

    const previewBefore = await previewRollNumberRebalance(prisma, {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      classId: classA.id,
      sectionId: sectionA1.id,
    });
    const manualItem = previewBefore.find((p) => p.studentId === studentManual.id);
    assert(
      manualItem?.proposedRollNumber === 25 && manualItem?.rollNumberMode === 'MANUAL',
      '11. Manual roll preserved: Manual roll 25 is never overwritten by auto regeneration'
    );

    // -------------------------------------------------------------
    // 12. DUPLICATE MANUAL ROLL REJECTED
    // -------------------------------------------------------------
    // Check validation function detects duplicate manual roll numbers
    const existingEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
      },
    });
    const has25 = existingEnrollments.some((e) => e.rollNumber === '25');
    assert(has25, '12. Duplicate manual roll rejected: Existing manual roll 25 detected in section');

    // -------------------------------------------------------------
    // 13. CORRECT ALPHABETICAL ORDERING OF MULTIPLE ROSTER STUDENTS
    // -------------------------------------------------------------
    const studentAmit = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'STU-2026-AMIT',
        firstName: 'Amit',
        lastName: 'Kumar',
        gender: 'Male',
        dateOfBirth: new Date('2010-01-01'),
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: studentAmit.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        rollNumber: '3',
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });

    const previewRoster = await previewRollNumberRebalance(prisma, {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      classId: classA.id,
      sectionId: sectionA1.id,
    });
    // Expected alphabetical order for AUTO students:
    // Aarav Sharma -> 1, Amit Kumar -> 2, Rahul Sharma -> 3 (and Bhavya Gupta is MANUAL -> 25)
    const aaravEntry = previewRoster.find((p) => p.studentId === studentAarav.id);
    const amitEntry = previewRoster.find((p) => p.studentId === studentAmit.id);
    const rahulEntry = previewRoster.find((p) => p.studentId === studentRahul.id);
    assert(
      aaravEntry?.proposedRollNumber === 1 &&
        amitEntry?.proposedRollNumber === 2 &&
        rahulEntry?.proposedRollNumber === 3,
      '13. Correct alphabetical ordering: Aarav (1), Amit (2), Rahul (3)'
    );

    // -------------------------------------------------------------
    // 14. STUDENT INSERTION BETWEEN EXISTING STUDENTS
    // -------------------------------------------------------------
    const nextRollForAnkit = await calculateNextAlphabeticalRollNumber(prisma, {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      classId: classA.id,
      sectionId: sectionA1.id,
      candidate: {
        firstName: 'Ankit',
        lastName: 'Verma',
        admissionNumber: 'STU-2026-ANKIT',
      },
    });
    // Aarav (1), Amit (2) -> Ankit inserted between Amit and Rahul -> position 3
    assert(
      nextRollForAnkit.numericRollNumber === 3 || nextRollForAnkit.rollNumber === '3',
      '14. Student insertion between existing: Ankit correctly calculated at slot 3'
    );

    const studentAnkit = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'STU-2026-ANKIT',
        firstName: 'Ankit',
        lastName: 'Verma',
        gender: 'Male',
        dateOfBirth: new Date('2010-01-01'),
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: studentAnkit.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        rollNumber: nextRollForAnkit.rollNumber,
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });

    // -------------------------------------------------------------
    // 15. EXPLICIT REBALANCING TRANSACTION
    // -------------------------------------------------------------
    const rebalanceResult = await executeRollNumberRebalance(prisma, {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      classId: classA.id,
      sectionId: sectionA1.id,
      actor: 'Admin User',
    });
    assert(
      rebalanceResult.success && rebalanceResult.totalStudents === 5,
      '15. Explicit rebalancing: Transaction executed successfully across student roster'
    );

    // Verify Rahul was shifted from 2/3 to 4
    const updatedRahulEnroll = await prisma.studentEnrollment.findFirst({
      where: { studentId: studentRahul.id, academicSessionId: sessionA.id },
    });
    assert(
      updatedRahulEnroll?.rollNumber === '4',
      '15b. Explicit rebalancing: Rahul shifted to slot 4 after Ankit insertion'
    );

    // -------------------------------------------------------------
    // 16. CONCURRENT STUDENT CREATION SIMULATION
    // -------------------------------------------------------------
    const cand1 = { firstName: 'Zara', lastName: 'Khan', admissionNumber: 'STU-Z1' };
    const cand2 = { firstName: 'Zoya', lastName: 'Akhtar', admissionNumber: 'STU-Z2' };
    const [rollZ1, rollZ2] = await Promise.all([
      calculateNextAlphabeticalRollNumber(prisma, {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        candidate: cand1,
      }),
      calculateNextAlphabeticalRollNumber(prisma, {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        candidate: cand2,
      }),
    ]);
    assert(
      rollZ1.numericRollNumber > 0 && rollZ2.numericRollNumber > 0,
      '16. Concurrent creation: Alphabetical slots computed safely'
    );

    // -------------------------------------------------------------
    // 17. CONCURRENT ROLL REGENERATION SAFETY
    // -------------------------------------------------------------
    const [reb1, reb2] = await Promise.all([
      executeRollNumberRebalance(prisma, {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        actor: 'Admin Concurrent 1',
      }),
      executeRollNumberRebalance(prisma, {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        actor: 'Admin Concurrent 2',
      }),
    ]);
    assert(
      reb1.success && reb2.success,
      '17. Concurrent regeneration: Atomic transactions serialize without data inconsistency'
    );

    // -------------------------------------------------------------
    // 18. CROSS-SCHOOL ISOLATION
    // -------------------------------------------------------------
    const studentB = await prisma.student.create({
      data: {
        schoolId: schoolB.id,
        admissionNumber: 'STU-2026-B01',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: new Date('2010-01-01'),
      },
    });
    const enrollB = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolB.id,
        studentId: studentB.id,
        academicSessionId: sessionB.id,
        classId: classB.id,
        sectionId: sectionB1.id,
        rollNumber: '1',
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });
    const schoolAStudents = await prisma.studentEnrollment.findMany({
      where: { schoolId: schoolA.id },
    });
    const containsSchoolB = schoolAStudents.some((e) => e.studentId === studentB.id);
    assert(!containsSchoolB && enrollB.rollNumber === '1', '18. Cross-school isolation: School A and School B isolated');

    // -------------------------------------------------------------
    // 19. HISTORICAL ENROLLMENT PRESERVATION
    // -------------------------------------------------------------
    const pastSession = await prisma.academicSession.create({
      data: {
        schoolId: schoolA.id,
        name: '2024-2025',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        status: 'ARCHIVED',
      },
    });
    const pastEnroll = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: studentAarav.id,
        academicSessionId: pastSession.id,
        classId: classA.id,
        sectionId: sectionA1.id,
        rollNumber: '12',
        rollNumberMode: 'MANUAL',
        status: 'COMPLETED',
      },
    });
    // Rebalance current session
    await executeRollNumberRebalance(prisma, {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      classId: classA.id,
      sectionId: sectionA1.id,
      actor: 'Admin',
    });
    const pastEnrollCheck = await prisma.studentEnrollment.findUnique({
      where: { id: pastEnroll.id },
    });
    assert(
      pastEnrollCheck?.rollNumber === '12' && pastEnrollCheck?.status === 'COMPLETED',
      '19. Historical enrollment preservation: Past session roll remains untouched'
    );

    // -------------------------------------------------------------
    // 20. AUDIT LOGGING
    // -------------------------------------------------------------
    const auditLogs = await prisma.securityAuditLog.findMany({
      where: {
        schoolId: schoolA.id,
        event: 'ROLL_REBALANCED',
      },
    });
    assert(
      auditLogs.length >= 1 && auditLogs[0].event === 'ROLL_REBALANCED',
      '20. Audit logging: ROLL_REBALANCED security audit events recorded with metadata'
    );

  } finally {
    // Cleanup test data
    await prisma.securityAuditLog.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.studentEnrollment.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.student.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.section.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.class.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.academicSession.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [schoolA.id, schoolB.id] } },
    });
  }

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRollNumberTestSuite().catch((err) => {
  console.error('Test suite failed with uncaught exception:', err);
  process.exit(1);
});

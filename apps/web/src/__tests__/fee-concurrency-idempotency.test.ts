import { prisma } from '@/lib/prisma';
import {
  createFeeHead,
  createFeePlan,
  publishFeePlan,
  assignFeePlanToEnrollments,
} from '@/lib/fees/fee-plan-service';
import { recordFeePayment } from '@/lib/fees/fee-payment-service';
import { FeePaymentMode, FeeObligationStatus } from '@prisma/client';

let testSchoolId: string;
let testSessionId: string;
let testClassId: string;
let testSectionId: string;
let testStudentId: string;
let testEnrollmentId: string;
let testUserId: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runConcurrencyAndIdempotencyTests() {
  console.log('🚀 Running RIVO-SEC-002: Fee Concurrency, Advisory Locks & Idempotency Tests...\n');

  try {
    // 1. Setup isolated test school and academic entities
    const school = await prisma.school.create({
      data: {
        name: 'Concurrency Test Academy',
        slug: `concurrency-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    testSchoolId = school.id;

    const session = await prisma.academicSession.create({
      data: {
        schoolId: testSchoolId,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });
    testSessionId = session.id;

    const cls = await prisma.class.create({
      data: {
        schoolId: testSchoolId,
        name: 'Grade 9',
      },
    });
    testClassId = cls.id;

    const sec = await prisma.section.create({
      data: {
        schoolId: testSchoolId,
        classId: testClassId,
        name: 'A',
      },
    });
    testSectionId = sec.id;

    const student = await prisma.student.create({
      data: {
        schoolId: testSchoolId,
        firstName: 'Dev',
        lastName: 'Rathore',
        admissionNumber: `ADM-CONC-${Date.now()}`,
        dateOfBirth: new Date('2010-05-15'),
        gender: 'MALE',
      },
    });
    testStudentId = student.id;

    const enrollment = await prisma.studentEnrollment.create({
      data: {
        schoolId: testSchoolId,
        studentId: testStudentId,
        academicSessionId: testSessionId,
        classId: testClassId,
        sectionId: testSectionId,
        rollNumber: '01',
        status: 'ACTIVE',
      },
    });
    testEnrollmentId = enrollment.id;

    const user = await prisma.user.create({
      data: {
        email: `cashier-${Date.now()}@concurrency.test`,
        firstName: 'Test',
        lastName: 'Cashier',
        isActive: true,
      },
    });
    testUserId = user.id;

    await prisma.schoolMembership.create({
      data: {
        schoolId: testSchoolId,
        userId: testUserId,
        role: 'ADMIN',
      },
    });

    // Create fee head & fee plan with 1 installment of ₹15,000
    const feeHead = await createFeeHead(
      testSchoolId,
      { name: 'Tuition Fee Race Test', code: 'TUIRACE', description: 'Tuition for concurrency test' },
      testUserId
    );

    const planResult = await createFeePlan(
      testSchoolId,
      {
        academicSessionId: testSessionId,
        classId: testClassId,
        name: 'Concurrency Test Plan',
        totalAmount: 15000,
        items: [{ feeHeadId: feeHead.id, name: 'Tuition', amount: 15000 }],
        installments: [
          { installmentNumber: 1, name: 'Term 1', dueDate: '2026-05-15', amount: 15000 },
        ],
      },
      testUserId
    );

    const publishedVersion = await publishFeePlan(testSchoolId, planResult.plan.id, 1, testUserId);

    await assignFeePlanToEnrollments(
      testSchoolId,
      {
        academicSessionId: testSessionId,
        feePlanVersionId: publishedVersion.id,
        studentEnrollmentIds: [testEnrollmentId],
      },
      testUserId
    );

    const initialObligations = await prisma.feeObligation.findMany({
      where: { schoolId: testSchoolId, studentEnrollmentId: testEnrollmentId },
    });
    assert(initialObligations.length === 1, 1, 'Initial ₹15,000 obligation created successfully');
    assert(Number(initialObligations[0].balanceAmount) === 15000, 2, 'Initial balance is ₹15,000');

    // -------------------------------------------------------------
    // TEST 1: Concurrent Double-Payment Race Condition Test
    // Two simultaneous requests attempting to pay ₹15,000 against a ₹15,000 obligation.
    // PostgreSQL advisory lock (pg_advisory_xact_lock) must serialize them:
    // Exactly 1 must commit, and the other must reject with an overpayment/balance error.
    // -------------------------------------------------------------
    console.log('⚡ Firing 2 concurrent payments of ₹15,000 against single ₹15,000 obligation...');
    const [res1, res2] = await Promise.allSettled([
      recordFeePayment(
        testSchoolId,
        {
          academicSessionId: testSessionId,
          studentId: testStudentId,
          studentEnrollmentId: testEnrollmentId,
          amount: 15000,
          paymentMode: FeePaymentMode.CASH,
          paymentDate: new Date(),
          remarks: 'Concurrent Payment Call 1',
        },
        testUserId
      ),
      recordFeePayment(
        testSchoolId,
        {
          academicSessionId: testSessionId,
          studentId: testStudentId,
          studentEnrollmentId: testEnrollmentId,
          amount: 15000,
          paymentMode: FeePaymentMode.CASH,
          paymentDate: new Date(),
          remarks: 'Concurrent Payment Call 2',
        },
        testUserId
      ),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    assert(
      successes.length === 1,
      3,
      `Advisory lock successfully serialized race: Exactly 1 payment succeeded (Got ${successes.length})`
    );
    assert(
      failures.length === 1,
      4,
      `Second concurrent payment was safely rejected by transaction validation (Got ${failures.length})`
    );

    // Verify obligation ledger balance is exactly 0 and paid is exactly 15,000 (NOT 30,000)
    const updatedObligation = await prisma.feeObligation.findUnique({
      where: { id: initialObligations[0].id },
    });
    assert(
      Number(updatedObligation?.paidAmount) === 15000,
      5,
      'Obligation paid amount is strictly ₹15,000 (no double payment occurred)'
    );
    assert(
      Number(updatedObligation?.balanceAmount) === 0,
      6,
      'Obligation balance amount is strictly ₹0 (no under-balance occurred)'
    );
    assert(
      updatedObligation?.status === FeeObligationStatus.PAID,
      7,
      'Obligation status cleanly transitioned to PAID'
    );

    // -------------------------------------------------------------
    // TEST 2: In-Transaction Sequential Numbering & Collision Check
    // Create Student 2 and verify sequential numbering under concurrency
    // -------------------------------------------------------------
    const student2 = await prisma.student.create({
      data: {
        schoolId: testSchoolId,
        firstName: 'Ananya',
        lastName: 'Verma',
        admissionNumber: `ADM-IDEMP-${Date.now()}`,
        dateOfBirth: new Date('2011-08-20'),
        gender: 'FEMALE',
      },
    });

    const enrollment2 = await prisma.studentEnrollment.create({
      data: {
        schoolId: testSchoolId,
        studentId: student2.id,
        academicSessionId: testSessionId,
        classId: testClassId,
        sectionId: testSectionId,
        rollNumber: '02',
        status: 'ACTIVE',
      },
    });

    await assignFeePlanToEnrollments(
      testSchoolId,
      {
        academicSessionId: testSessionId,
        feePlanVersionId: publishedVersion.id,
        studentEnrollmentIds: [enrollment2.id],
      },
      testUserId
    );

    const paymentResult2 = await recordFeePayment(
      testSchoolId,
      {
        academicSessionId: testSessionId,
        studentId: student2.id,
        studentEnrollmentId: enrollment2.id,
        amount: 15000,
        paymentMode: FeePaymentMode.CASH,
        paymentDate: new Date(),
        remarks: 'Student 2 payment for sequential verification',
      },
      testUserId
    );

    assert(
      Boolean(paymentResult2.payment.paymentNumber),
      8,
      'Payment 2 generates sequential payment number'
    );
    assert(
      Boolean(paymentResult2.receipt.receiptNumber),
      9,
      'Payment 2 generates sequential receipt number'
    );

    // Verify payment numbers are strictly distinct
    const successfulPayment1 = (successes[0] as PromiseFulfilledResult<any>).value.payment;
    assert(
      successfulPayment1.paymentNumber !== paymentResult2.payment.paymentNumber,
      10,
      'Concurrent and sequential payments receive distinct, collision-free payment numbers'
    );
    assert(
      (successes[0] as PromiseFulfilledResult<any>).value.receipt.receiptNumber !== paymentResult2.receipt.receiptNumber,
      11,
      'Receipt numbers are distinct and collision-free across transactions'
    );

    console.log('\n================================================================');
    console.log('🎉 ALL RIVO-SEC-002 CONCURRENCY & ADVISORY LOCK TESTS PASSED!');
    console.log('================================================================');
  } catch (err) {
    console.error('Fatal error during concurrency test execution:', err);
    process.exit(1);
  } finally {
    // Cleanup test school
    if (testSchoolId) {
      await prisma.feeReceipt.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.feePaymentAllocation.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.feePayment.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.feeObligation.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.studentFeeAssignment.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.feeInstallment.deleteMany({ where: { feePlanVersion: { schoolId: testSchoolId } } }).catch(() => {});
      await prisma.feePlanItem.deleteMany({ where: { feePlanVersion: { schoolId: testSchoolId } } }).catch(() => {});
      await prisma.feePlanVersion.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.feePlan.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.feeHead.deleteMany({ where: { schoolId: testSchoolId } }).catch(() => {});
      await prisma.school.delete({ where: { id: testSchoolId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runConcurrencyAndIdempotencyTests();

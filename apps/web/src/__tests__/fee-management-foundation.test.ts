import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import {
  createFeeHead,
  createFeePlan,
  publishFeePlan,
  assignFeePlanToEnrollments,
  validatePlanSchedule,
} from '../lib/fees/fee-plan-service';
import {
  recordFeePayment,
  reverseFeePayment,
  getStudentFeeLedger,
  getReceiptPrintData,
  applyAdHocConcession,
  reverseAdHocConcession,
} from '../lib/fees/fee-payment-service';
import { generateReceiptPdfBuffer } from '../lib/fees/fee-pdf-service';
import {
  generateNextReceiptNumber,
  generateNextPaymentNumber,
  generateNextFeePlanCode,
} from '../lib/id-generator';
import { FeePaymentMode, FeePaymentStatus, FeeReceiptStatus, FeeObligationStatus } from '@prisma/client';

let schoolAId: string;
let schoolBId: string;
let sessionAId: string;
let class10AId: string;
let sectionAId: string;
let student1Id: string;
let enrollment1Id: string;
let student2Id: string;
let enrollment2Id: string;
let adminAUserId: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runFeeManagementTests() {
  console.log('🚀 Running Rivo Fee Management Foundation & Financial Integrity Tests...\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Isolated School A and School B
    // -------------------------------------------------------------
    const schoolA = await prisma.school.create({
      data: {
        name: 'Delhi Public Test School',
        slug: `dps-test-${Date.now()}`,
        status: 'ACTIVE',
        logoUrl: '/uploads/branding/dps-logo.png',
        address: 'Sector 24, Rohini, New Delhi',
        phone: '+91 11 2345 6789',
        email: 'accounts@dps-test.edu',
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        name: 'Bombay Scottish Test School',
        slug: `bsts-test-${Date.now()}`,
        status: 'ACTIVE',
        logoUrl: '/uploads/branding/bsts-logo.png',
        address: 'Mahim, Mumbai',
      },
    });
    schoolBId = schoolB.id;

    const adminUser = await prisma.user.create({
      data: {
        email: `bursar-${Date.now()}@dps-test.edu`,
        firstName: 'Vikram',
        lastName: 'Singhania',
        isActive: true,
      },
    });
    adminAUserId = adminUser.id;

    await prisma.schoolMembership.create({
      data: {
        schoolId: schoolAId,
        userId: adminAUserId,
        role: 'SCHOOL_ADMIN',
      },
    });

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

    const class10 = await prisma.class.create({
      data: {
        schoolId: schoolAId,
        name: 'Class 10',
        displayOrder: 10,
      },
    });
    class10AId = class10.id;

    const sectionA = await prisma.section.create({
      data: {
        schoolId: schoolAId,
        classId: class10AId,
        name: 'Section A',
      },
    });
    sectionAId = sectionA.id;

    // Create Father & Student 1
    const father1 = await prisma.parent.create({
      data: {
        schoolId: schoolAId,
        firstName: 'Rajesh',
        lastName: 'Verma',
        phone: '+91 9876543210',
      },
    });

    const student1 = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        admissionNumber: `DPS-2026-0001-${Date.now().toString().slice(-4)}`,
        firstName: 'Aarav',
        lastName: 'Verma',
        gender: 'MALE',
        stream: 'Science',
      },
    });
    student1Id = student1.id;

    await prisma.parentStudent.create({
      data: {
        parentId: father1.id,
        studentId: student1Id,
        relationshipType: 'FATHER',
        isPrimaryContact: true,
      },
    });

    const enrollment1 = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolAId,
        studentId: student1Id,
        academicSessionId: sessionAId,
        classId: class10AId,
        sectionId: sectionAId,
        rollNumber: '01',
        status: 'ACTIVE',
      },
    });
    enrollment1Id = enrollment1.id;

    // Student 2
    const student2 = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        admissionNumber: `DPS-2026-0002-${Date.now().toString().slice(-4)}`,
        firstName: 'Ananya',
        lastName: 'Sharma',
        gender: 'FEMALE',
      },
    });
    student2Id = student2.id;

    const enrollment2 = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolAId,
        studentId: student2Id,
        academicSessionId: sessionAId,
        classId: class10AId,
        sectionId: sectionAId,
        rollNumber: '02',
        status: 'ACTIVE',
      },
    });
    enrollment2Id = enrollment2.id;

    // -------------------------------------------------------------
    // TEST 1: Create Fee Heads
    // -------------------------------------------------------------
    const tuitionHead = await createFeeHead(
      schoolAId,
      { name: 'Tuition Fee', code: 'TUIT', description: 'Academic instruction fee' },
      adminAUserId
    );
    assert(tuitionHead.code === 'TUIT' && tuitionHead.name === 'Tuition Fee', 1, 'FeeHead created with exact code and name');

    const labHead = await createFeeHead(
      schoolAId,
      { name: 'Laboratory Fee', code: 'LAB', description: 'Science lab maintenance' },
      adminAUserId
    );
    assert(labHead.code === 'LAB', 2, 'Second FeeHead created cleanly');

    // -------------------------------------------------------------
    // TEST 2: Duplicate Fee Head Code in Same School Rejected
    // -------------------------------------------------------------
    let duplicateRejected = false;
    try {
      await createFeeHead(
        schoolAId,
        { name: 'Tuition Again', code: 'TUIT' },
        adminAUserId
      );
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 3, 'Duplicate fee head code in same school strictly rejected');

    // -------------------------------------------------------------
    // TEST 3: Installment Validation - Schedule sum mismatch rejected
    // -------------------------------------------------------------
    const invalidScheduleCheck = validatePlanSchedule(
      60000,
      [{ feeHeadId: tuitionHead.id, name: 'Tuition', amount: 60000 }],
      [
        { installmentNumber: 1, name: 'Term 1', dueDate: '2026-04-10', amount: 30000 },
        { installmentNumber: 2, name: 'Term 2', dueDate: '2026-07-10', amount: 25000 }, // sum = 55000 != 60000
      ]
    );
    assert(!invalidScheduleCheck.isValid && invalidScheduleCheck.errors.length > 0, 4, 'Installment sum mismatch rejected by validation engine');

    // -------------------------------------------------------------
    // TEST 4: Installment Validation - Components sum mismatch rejected
    // -------------------------------------------------------------
    const invalidCompCheck = validatePlanSchedule(
      60000,
      [{ feeHeadId: tuitionHead.id, name: 'Tuition', amount: 50000 }], // 50k != 60k
      [{ installmentNumber: 1, name: 'Term 1', dueDate: '2026-04-10', amount: 60000 }]
    );
    assert(!invalidCompCheck.isValid, 5, 'Components sum mismatch rejected by validation engine');

    // -------------------------------------------------------------
    // TEST 5: Create Fee Plan with Custom Unequal Installment Schedule
    // -------------------------------------------------------------
    const planResult = await createFeePlan(
      schoolAId,
      {
        academicSessionId: sessionAId,
        classId: class10AId,
        streamId: 'Science',
        name: 'Class 10 Science Annual Plan',
        totalAmount: 60000,
        items: [
          { feeHeadId: tuitionHead.id, name: 'Tuition Fee', amount: 45000 },
          { feeHeadId: labHead.id, name: 'Laboratory Fee', amount: 15000 },
        ],
        // Unequal custom school-defined EMI schedule
        installments: [
          { installmentNumber: 1, name: 'Quarter 1 (April)', dueDate: '2026-04-15', amount: 20000 },
          { installmentNumber: 2, name: 'Quarter 2 (July)', dueDate: '2026-07-15', amount: 15000 },
          { installmentNumber: 3, name: 'Quarter 3 (October)', dueDate: '2026-10-15', amount: 15000 },
          { installmentNumber: 4, name: 'Quarter 4 (January)', dueDate: '2027-01-15', amount: 10000 },
        ],
      },
      adminAUserId
    );
    assert(planResult.plan.status === 'DRAFT', 6, 'Fee plan created in DRAFT status initially');
    assert(planResult.version.versionNumber === 1, 7, 'Fee plan version 1 initialized');

    // -------------------------------------------------------------
    // TEST 6: Publish Fee Plan Version Locks the Structure
    // -------------------------------------------------------------
    const publishedVersion = await publishFeePlan(schoolAId, planResult.plan.id, 1, adminAUserId);
    assert(publishedVersion.status === 'PUBLISHED', 8, 'Fee plan version successfully published');

    const activePlan = await prisma.feePlan.findUnique({ where: { id: planResult.plan.id } });
    assert(activePlan?.status === 'ACTIVE', 9, 'Master FeePlan activated on version publishing');

    // -------------------------------------------------------------
    // TEST 7: Authoritative ID Generation for Fee Plan Code
    // -------------------------------------------------------------
    const feePlanCode = await generateNextFeePlanCode(schoolAId, 'CLS10', 'SCI', { year: 2026 });
    assert(feePlanCode.includes('FP-CLS10-SCI-2026'), 10, 'Authoritative Fee Plan code derived cleanly via Rivo ID system');

    // -------------------------------------------------------------
    // TEST 8: Assign Fee Plan to Student Enrollment & Generate Obligations
    // -------------------------------------------------------------
    const assignments = await assignFeePlanToEnrollments(
      schoolAId,
      {
        academicSessionId: sessionAId,
        feePlanVersionId: publishedVersion.id,
        studentEnrollmentIds: [enrollment1Id],
      },
      adminAUserId
    );
    assert(assignments.length === 1, 11, 'Fee plan assigned to Student 1 enrollment');

    const obligations = await prisma.feeObligation.findMany({
      where: { schoolId: schoolAId, studentId: student1Id },
      orderBy: { dueDate: 'asc' },
    });
    assert(obligations.length === 4, 12, 'Exact 4 installment obligations generated for student');
    assert(Number(obligations[0].netAmount) === 20000, 13, 'Quarter 1 obligation net amount is exactly ₹20,000');
    assert(Number(obligations[3].netAmount) === 10000, 14, 'Quarter 4 obligation net amount is exactly ₹10,000');

    // -------------------------------------------------------------
    // TEST 9: Student-Specific Concession Allocation
    // -------------------------------------------------------------
    // Assign to student 2 with ₹5,000 concession
    await assignFeePlanToEnrollments(
      schoolAId,
      {
        academicSessionId: sessionAId,
        feePlanVersionId: publishedVersion.id,
        studentEnrollmentIds: [enrollment2Id],
        customConcessionAmount: 5000,
        concessionReason: 'Merit Scholarship for Science Top Rank',
        concessionApprovedByUserId: adminAUserId,
      },
      adminAUserId
    );

    const s2Obligations = await prisma.feeObligation.findMany({
      where: { schoolId: schoolAId, studentId: student2Id },
      orderBy: { dueDate: 'asc' },
    });
    // First installment had ₹20,000 original, minus ₹5,000 concession = ₹15,000 net
    assert(Number(s2Obligations[0].concessionAmount) === 5000, 15, 'Concession of ₹5,000 applied to first installment');
    assert(Number(s2Obligations[0].netAmount) === 15000, 16, 'Net payable on installment 1 reduced to ₹15,000');
    assert(Number(s2Obligations[1].concessionAmount) === 0, 17, 'Subsequent installments retain standard amounts');

    // -------------------------------------------------------------
    // TEST 10: Cash Payment - First Partial Payment (Oldest Due First)
    // -------------------------------------------------------------
    // Obligation 1 for Student 1 is ₹20,000. Pay ₹12,000 in CASH.
    const payResult1 = await recordFeePayment(
      schoolAId,
      {
        academicSessionId: sessionAId,
        studentId: student1Id,
        studentEnrollmentId: enrollment1Id,
        amount: 12000,
        paymentMode: FeePaymentMode.CASH,
        remarks: 'Counter cash deposit by parent',
      },
      adminAUserId
    );

    assert(payResult1.payment.paymentMode === 'CASH', 18, 'CASH payment recorded as first-class payment mode');
    assert(payResult1.payment.paymentNumber.includes('-PAY-'), 19, 'Authoritative sequential Payment ID generated');
    assert(payResult1.receipt.receiptNumber.includes('-RCT-'), 20, 'Authoritative sequential Receipt ID generated');

    // Verify obligation balance
    const ob1AfterPay = await prisma.feeObligation.findUnique({ where: { id: obligations[0].id } });
    assert(Number(ob1AfterPay?.paidAmount) === 12000, 21, 'Obligation paid amount updated to ₹12,000');
    assert(Number(ob1AfterPay?.balanceAmount) === 8000, 22, 'Obligation balance amount accurately reflects ₹8,000');
    assert(ob1AfterPay?.status === FeeObligationStatus.PARTIALLY_PAID, 23, 'Obligation status transitioned to PARTIALLY_PAID');

    // -------------------------------------------------------------
    // TEST 11: Immutable Student Snapshot on Legal Receipt
    // -------------------------------------------------------------
    const receiptSnapshot = payResult1.receipt.studentSnapshot as any;
    assert(receiptSnapshot.name === 'Aarav Verma', 24, 'Student name accurately frozen on receipt snapshot');
    assert(receiptSnapshot.fatherOrGuardianName === 'Rajesh Verma', 25, 'Father name accurately captured on receipt');
    assert(receiptSnapshot.className === 'Class 10', 26, 'Class captured on receipt');
    assert(receiptSnapshot.rollNumber === '01', 27, 'Roll number captured on receipt');

    // -------------------------------------------------------------
    // TEST 12: Second Payment Settles Remainder of Obligation 1
    // -------------------------------------------------------------
    // Pay ₹8,000 to fully settle Obligation 1
    await recordFeePayment(
      schoolAId,
      {
        academicSessionId: sessionAId,
        studentId: student1Id,
        studentEnrollmentId: enrollment1Id,
        amount: 8000,
        paymentMode: FeePaymentMode.UPI,
        referenceNumber: 'UPI/20260926/998877',
      },
      adminAUserId
    );

    const ob1Settled = await prisma.feeObligation.findUnique({ where: { id: obligations[0].id } });
    assert(Number(ob1Settled?.balanceAmount) === 0, 28, 'Obligation balance reached ₹0 after final settlement');
    assert(ob1Settled?.status === FeeObligationStatus.PAID, 29, 'Obligation status transitioned to PAID');

    // -------------------------------------------------------------
    // TEST 13: Multi-Obligation Spillover Payment
    // -------------------------------------------------------------
    // Obligation 2 is ₹15,000, Obligation 3 is ₹15,000.
    // Pay ₹20,000. It should completely pay Ob 2 (₹15k) and partially pay Ob 3 (₹5k).
    const spilloverPay = await recordFeePayment(
      schoolAId,
      {
        academicSessionId: sessionAId,
        studentId: student1Id,
        studentEnrollmentId: enrollment1Id,
        amount: 20000,
        paymentMode: FeePaymentMode.BANK_TRANSFER,
        referenceNumber: 'NEFT-AXIS-0099881',
      },
      adminAUserId
    );

    assert(spilloverPay.allocationsCount === 2, 30, 'Spillover payment created 2 allocations across distinct obligations');

    const ob2 = await prisma.feeObligation.findUnique({ where: { id: obligations[1].id } });
    const ob3 = await prisma.feeObligation.findUnique({ where: { id: obligations[2].id } });
    assert(ob2?.status === FeeObligationStatus.PAID, 31, 'Second obligation fully PAID');
    assert(Number(ob3?.paidAmount) === 5000, 32, 'Third obligation partially paid with ₹5,000');
    assert(Number(ob3?.balanceAmount) === 10000, 33, 'Third obligation has ₹10,000 balance remaining');

    // -------------------------------------------------------------
    // TEST 14: Over-Payment Rejected
    // -------------------------------------------------------------
    // Remaining total dues for Student 1: Ob 3 has ₹10k, Ob 4 has ₹10k = ₹20,000 total.
    // Try to pay ₹25,000.
    let overpaymentRejected = false;
    try {
      await recordFeePayment(
        schoolAId,
        {
          academicSessionId: sessionAId,
          studentId: student1Id,
          studentEnrollmentId: enrollment1Id,
          amount: 25000,
          paymentMode: FeePaymentMode.CASH,
        },
        adminAUserId
      );
    } catch {
      overpaymentRejected = true;
    }
    assert(overpaymentRejected, 34, 'Overpayment beyond outstanding dues rejected');

    // -------------------------------------------------------------
    // TEST 15: Payment Reversal with Audit Reason
    // -------------------------------------------------------------
    // Reverse the spillover payment of ₹20,000
    const reversed = await reverseFeePayment(
      schoolAId,
      {
        paymentId: spilloverPay.payment.id,
        reversalReason: 'Accidental double entry by accountant',
      },
      adminAUserId
    );
    assert(reversed.status === FeePaymentStatus.REVERSED, 35, 'Payment status updated to REVERSED');

    // Verify receipt marked CANCELLED
    const cancelledReceipt = await prisma.feeReceipt.findUnique({ where: { paymentId: spilloverPay.payment.id } });
    assert(cancelledReceipt?.status === FeeReceiptStatus.CANCELLED, 36, 'Associated receipt marked CANCELLED');

    // Verify obligations rolled back
    const ob2RolledBack = await prisma.feeObligation.findUnique({ where: { id: obligations[1].id } });
    const ob3RolledBack = await prisma.feeObligation.findUnique({ where: { id: obligations[2].id } });
    assert(Number(ob2RolledBack?.paidAmount) === 0 && ob2RolledBack?.status === FeeObligationStatus.PENDING, 37, 'Obligation 2 rolled back to PENDING with 0 paid');
    assert(Number(ob3RolledBack?.paidAmount) === 0 && ob3RolledBack?.status === FeeObligationStatus.PENDING, 38, 'Obligation 3 rolled back to PENDING with 0 paid');

    // -------------------------------------------------------------
    // TEST 16: Silent Reversal Without Reason Rejected
    // -------------------------------------------------------------
    let emptyReasonRejected = false;
    try {
      await reverseFeePayment(
        schoolAId,
        { paymentId: payResult1.payment.id, reversalReason: '   ' },
        adminAUserId
      );
    } catch {
      emptyReasonRejected = true;
    }
    assert(emptyReasonRejected, 39, 'Reversal without detailed audit reason rejected');

    // -------------------------------------------------------------
    // TEST 17: Tenant Isolation - Cross-School Payment Access Blocked
    // -------------------------------------------------------------
    let crossSchoolBlocked = false;
    try {
      // School B trying to reverse School A's payment
      await reverseFeePayment(
        schoolBId,
        { paymentId: payResult1.payment.id, reversalReason: 'Cross school unauthorized attempt' },
        adminAUserId
      );
    } catch (err: any) {
      if (err.message.includes('not found')) {
        crossSchoolBlocked = true;
      }
    }
    assert(crossSchoolBlocked, 40, 'School B denied access to School A payment record (Tenant Isolation)');

    // -------------------------------------------------------------
    // TEST 18: Tenant Isolation - Cross-School Receipt Print Blocked
    // -------------------------------------------------------------
    let crossReceiptBlocked = false;
    try {
      await getReceiptPrintData(schoolBId, payResult1.receipt.id);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        crossReceiptBlocked = true;
      }
    }
    assert(crossReceiptBlocked, 41, 'School B denied access to School A receipt data');

    // -------------------------------------------------------------
    // TEST 19: Full Student Fee Ledger Accuracy
    // -------------------------------------------------------------
    const ledger = await getStudentFeeLedger(schoolAId, student1Id, sessionAId);
    assert(ledger.summary.totalOriginal === 60000, 42, 'Ledger total original amount equals ₹60,000');
    assert(ledger.summary.totalPaid === 20000, 43, 'Ledger total paid amount accurately reflects active ₹20,000 paid');
    assert(ledger.summary.totalBalance === 40000, 44, 'Ledger total outstanding balance accurately reflects ₹40,000');

    // -------------------------------------------------------------
    // TEST 20: Financial Audit Log Entries Recorded
    // -------------------------------------------------------------
    const auditLogs = await prisma.feeAuditLog.findMany({
      where: { schoolId: schoolAId },
    });
    const actions = auditLogs.map((l) => l.action);
    assert(actions.includes('PLAN_CREATED'), 45, 'FeeAuditLog: PLAN_CREATED recorded');
    assert(actions.includes('PLAN_PUBLISHED'), 46, 'FeeAuditLog: PLAN_PUBLISHED recorded');
    assert(actions.includes('ASSIGNMENT_CREATED'), 47, 'FeeAuditLog: ASSIGNMENT_CREATED recorded');
    assert(actions.includes('PAYMENT_COLLECTED'), 48, 'FeeAuditLog: PAYMENT_COLLECTED recorded');
    assert(actions.includes('PAYMENT_REVERSED'), 49, 'FeeAuditLog: PAYMENT_REVERSED recorded');

    // -------------------------------------------------------------
    // TEST 21: Workstream A - Apply Mid-Year Ad-Hoc Fixed Concession
    // -------------------------------------------------------------
    // Student 1 has unpaid obligations with ₹40,000 balance total.
    // Grant ₹5,000 merit concession.
    const concResult = await applyAdHocConcession(
      schoolAId,
      {
        studentId: student1Id,
        studentEnrollmentId: enrollment1Id,
        academicSessionId: sessionAId,
        type: 'FIXED_AMOUNT',
        rateOrAmount: 5000,
        category: 'MERIT',
        reason: 'Mid-term academic honors concession approved by Principal',
      },
      adminAUserId
    );
    assert(concResult.success === true, 50, 'Mid-year concession applied successfully');
    assert(concResult.totalAppliedConcession === 5000, 51, 'Exact ₹5,000 concession applied across obligations');

    const updatedLedger = await getStudentFeeLedger(schoolAId, student1Id, sessionAId);
    assert(updatedLedger.summary.totalBalance === 35000, 52, 'Student total balance reduced from ₹40,000 to ₹35,000');
    assert(updatedLedger.summary.totalPaid === 20000, 53, 'Historical paid amount strictly unchanged at ₹20,000');

    // -------------------------------------------------------------
    // TEST 22: Concession Exceeding Outstanding Dues Blocked
    // -------------------------------------------------------------
    let excessConcessionBlocked = false;
    try {
      await applyAdHocConcession(
        schoolAId,
        {
          studentId: student1Id,
          studentEnrollmentId: enrollment1Id,
          academicSessionId: sessionAId,
          type: 'FIXED_AMOUNT',
          rateOrAmount: 999999, // Exceeds outstanding
          category: 'MERIT',
          reason: 'Excessive concession attempt',
        },
        adminAUserId
      );
    } catch (err: any) {
      if (err.message.includes('exceeds')) {
        excessConcessionBlocked = true;
      }
    }
    assert(excessConcessionBlocked, 54, 'Concession exceeding outstanding balance strictly rejected');

    // -------------------------------------------------------------
    // TEST 23: Workstream A - Reversal of Applied Concession
    // -------------------------------------------------------------
    const affectedObId = concResult.affectedObligations[0].obligationId;
    const revConcResult = await reverseAdHocConcession(
      schoolAId,
      {
        obligationId: affectedObId,
        reversalReason: 'Concession applied erroneously to student',
      },
      adminAUserId
    );
    assert(revConcResult.success === true, 55, 'Applied concession reversed successfully');

    const ledgerAfterRev = await getStudentFeeLedger(schoolAId, student1Id, sessionAId);
    assert(ledgerAfterRev.summary.totalBalance === 40000, 56, 'Outstanding balance restored to ₹40,000 after reversal');

    // -------------------------------------------------------------
    // TEST 24: Workstream B - Server-Side PDF Binary Generation
    // -------------------------------------------------------------
    const pdfBytes = await generateReceiptPdfBuffer({
      schoolName: 'Delhi Public Test School',
      schoolAddress: 'Sector 24, Rohini, New Delhi',
      schoolPhone: '+91 11 2345 6789',
      schoolEmail: 'accounts@dps-test.edu',
      receiptNumber: 'RCP-2026-00001',
      paymentNumber: 'PAY-2026-00001',
      receiptDate: new Date(),
      paymentMode: 'CASH',
      status: 'ISSUED',
      studentName: 'Aarav Sharma',
      admissionNumber: 'ADM-2026-001',
      className: 'Class 10',
      sectionName: 'A',
      rollNumber: '1',
      fatherName: 'Rajesh Sharma',
      allocations: [
        { title: 'Quarter 1 Tuition Fee', amount: 15000 },
        { title: 'Quarter 2 Tuition Fee', amount: 5000 },
      ],
      totalPaid: 20000,
      issuedByName: 'Accounts Office',
    });

    assert(pdfBytes instanceof Uint8Array, 57, 'generateReceiptPdfBuffer returned Uint8Array binary');
    assert(pdfBytes.byteLength > 500, 58, 'PDF document byte length is valid (> 500 bytes)');

    // Verify PDF Magic Header bytes: %PDF- (ASCII: 0x25, 0x50, 0x44, 0x46, 0x2D)
    const headerStr = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
    assert(headerStr === '%PDF-', 59, 'Generated binary contains valid %PDF- magic signature header');

    // -------------------------------------------------------------
    // TEST 25: Workstream B - Cancelled Receipt PDF Rendering
    // -------------------------------------------------------------
    const cancelledPdfBytes = await generateReceiptPdfBuffer({
      schoolName: 'Delhi Public Test School',
      receiptNumber: 'RCP-2026-00001',
      paymentNumber: 'PAY-2026-00001',
      receiptDate: new Date(),
      paymentMode: 'CASH',
      status: 'CANCELLED',
      studentName: 'Aarav Sharma',
      admissionNumber: 'ADM-2026-001',
      allocations: [{ title: 'Quarter 1 Tuition Fee', amount: 20000 }],
      totalPaid: 20000,
    });
    const cancelledHeader = Buffer.from(cancelledPdfBytes.slice(0, 5)).toString('ascii');
    assert(cancelledHeader === '%PDF-', 60, 'Cancelled status PDF generated with valid structure');

    console.log('\n================================================================');
    console.log('🎉 ALL 60 FEE MANAGEMENT FOUNDATION & ADVANCED TESTS PASSED!');
    console.log('================================================================');
  } catch (error) {
    console.error('Fatal error during fee tests:', error);
    process.exit(1);
  } finally {
    // Cleanup isolated test schools respecting foreign key RESTRICT constraints
    if (schoolAId) {
      await prisma.feeReceipt.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feePaymentAllocation.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feePayment.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feeObligation.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.studentFeeAssignment.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feeInstallment.deleteMany({ where: { feePlanVersion: { schoolId: schoolAId } } }).catch(() => {});
      await prisma.feePlanItem.deleteMany({ where: { feePlanVersion: { schoolId: schoolAId } } }).catch(() => {});
      await prisma.feePlanVersion.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feePlan.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feeHead.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.feeAuditLog.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.school.delete({ where: { id: schoolAId } }).catch(() => {});
    }
    if (schoolBId) {
      await prisma.school.delete({ where: { id: schoolBId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runFeeManagementTests();

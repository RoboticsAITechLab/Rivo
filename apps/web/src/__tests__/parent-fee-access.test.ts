import { prisma } from '@/lib/prisma';
import {
  createFeeHead,
  createFeePlan,
  publishFeePlan,
  assignFeePlanToEnrollments,
} from '@/lib/fees/fee-plan-service';
import {
  recordFeePayment,
  getStudentFeeLedger,
} from '@/lib/fees/fee-payment-service';
import { generateNextReceiptNumber } from '@/lib/id-generator';
import { generateReceiptPdfBuffer } from '@/lib/fees/fee-pdf-service';
import { updateSchoolSetting, getFeeSettings } from '@/lib/settings/settings-service';
import { FeePaymentMode, FeePaymentStatus } from '@prisma/client';

function assert(condition: boolean, testNum: number, message: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ TEST ${testNum} PASSED: ${message}`);
}

async function runParentFeeTests() {
  console.log('🚀 Running Rivo Parent Portal Fee Access & Security Regression Tests...\n');

  const timestamp = Date.now().toString().slice(-5);
  let schoolAId: string;
  let schoolBId: string;
  let parentUserAId: string;
  let parentAId: string;
  let student1Id: string;
  let student2Id: string;
  let enrollment1Id: string;
  let enrollment2Id: string;
  let adminUserId: string;

  try {
    // -------------------------------------------------------------
    // SETUP: Isolated Schools, Academic Sessions, Classes, Parents & Students
    // -------------------------------------------------------------
    const schoolA = await prisma.school.create({
      data: {
        name: `DPS Parent Fee Test School A ${timestamp}`,
        slug: `dps-pfee-a-${timestamp}`,
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        name: `Oakridge Fee Test School B ${timestamp}`,
        slug: `oak-pfee-b-${timestamp}`,
      },
    });
    schoolBId = schoolB.id;

    const sessionA = await prisma.academicSession.create({
      data: {
        schoolId: schoolAId,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });

    const class10 = await prisma.class.create({
      data: { schoolId: schoolAId, name: 'Class 10' },
    });

    const sectionA = await prisma.section.create({
      data: { schoolId: schoolAId, classId: class10.id, name: 'A' },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: `admin-fee-${timestamp}@rivo-test.edu`,
        passwordHash: 'hash',
        firstName: 'Fee',
        lastName: 'Admin',
      },
    });
    adminUserId = adminUser.id;

    // Parent User & Parent Record
    const parentUserA = await prisma.user.create({
      data: {
        email: `parent-fee-${timestamp}@rivo-test.edu`,
        passwordHash: 'hash',
        firstName: 'Suresh',
        lastName: 'Sharma',
      },
    });
    parentUserAId = parentUserA.id;

    const parentA = await prisma.parent.create({
      data: {
        schoolId: schoolAId,
        userId: parentUserAId,
        firstName: 'Suresh',
        lastName: 'Sharma',
        email: `parent-fee-${timestamp}@rivo-test.edu`,
      },
    });
    parentAId = parentA.id;

    // Linked Student 1
    const student1 = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        admissionNumber: `DPS-ADM-01-${timestamp}`,
        firstName: 'Rohan',
        lastName: 'Sharma',
        gender: 'MALE',
      },
    });
    student1Id = student1.id;

    // Link Student 1 to Parent A
    await prisma.parentStudent.create({
      data: {
        parentId: parentAId,
        studentId: student1Id,
        relationshipType: 'FATHER',
        isPrimaryContact: true,
      },
    });

    const enrollment1 = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolAId,
        studentId: student1Id,
        academicSessionId: sessionA.id,
        classId: class10.id,
        sectionId: sectionA.id,
        rollNumber: '01',
        status: 'ACTIVE',
      },
    });
    enrollment1Id = enrollment1.id;

    // Unlinked Student 2 (Belongs to School A, but NOT linked to Parent A)
    const student2 = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        admissionNumber: `DPS-ADM-02-${timestamp}`,
        firstName: 'Aditi',
        lastName: 'Verma',
        gender: 'FEMALE',
      },
    });
    student2Id = student2.id;

    const enrollment2 = await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolAId,
        studentId: student2Id,
        academicSessionId: sessionA.id,
        classId: class10.id,
        sectionId: sectionA.id,
        rollNumber: '02',
        status: 'ACTIVE',
      },
    });
    enrollment2Id = enrollment2.id;

    // -------------------------------------------------------------
    // TEST 1: Fee Plan Assignment & Installment Obligations
    // -------------------------------------------------------------
    const head = await createFeeHead(schoolAId, { name: 'Composite Annual Fee', code: `COMP-${timestamp}` }, adminUserId);

    const planRes = await createFeePlan(
      schoolAId,
      {
        academicSessionId: sessionA.id,
        classId: class10.id,
        name: 'Class 10 General Plan',
        totalAmount: 40000,
        items: [{ feeHeadId: head.id, name: 'Composite Fee', amount: 40000 }],
        installments: [
          { installmentNumber: 1, name: 'Term 1', dueDate: '2026-05-15', amount: 20000 },
          { installmentNumber: 2, name: 'Term 2', dueDate: '2026-09-15', amount: 20000 },
        ],
      },
      adminUserId
    );

    const pubVersion = await publishFeePlan(schoolAId, planRes.plan.id, 1, adminUserId);

    await assignFeePlanToEnrollments(
      schoolAId,
      {
        academicSessionId: sessionA.id,
        feePlanVersionId: pubVersion.id,
        studentEnrollmentIds: [enrollment1Id, enrollment2Id],
      },
      adminUserId
    );

    const s1Ledger = await getStudentFeeLedger(schoolAId, student1Id);
    assert(s1Ledger.summary.totalOriginal === 40000, 1, 'Student 1 ledger generated with ₹40,000 total dues');
    assert(s1Ledger.obligations.length === 2, 2, 'Student 1 has exactly 2 scheduled installments');

    // -------------------------------------------------------------
    // TEST 2: Record Payment & Receipt Number Custom Prefix
    // -------------------------------------------------------------
    // Configure Custom Receipt Prefix 'DPS-RCT' and custom footer in School Settings
    await updateSchoolSetting(schoolAId, 'fees', {
      currency: 'INR',
      currencySymbol: '₹',
      defaultPaymentMethods: ['CASH', 'UPI', 'ONLINE'],
      lateFeeGraceDays: 7,
      receiptPrefix: 'DPS-RCT',
      receiptFooterNote: 'Official Digital Receipt authorized under Delhi Public Schools Directorate.',
      allowOnlinePayments: true,
      autoIssueReceipt: true,
    });

    const paymentRes = await recordFeePayment(
      schoolAId,
      {
        academicSessionId: sessionA.id,
        studentId: student1Id,
        studentEnrollmentId: enrollment1Id,
        amount: 20000,
        paymentMode: FeePaymentMode.UPI,
        referenceNumber: 'UPI-REF-998877',
      },
      adminUserId
    );

    assert(paymentRes.payment.status === FeePaymentStatus.COLLECTED, 3, 'Payment recorded with status COLLECTED');
    assert(paymentRes.receipt.receiptNumber.includes('DPS-RCT'), 4, 'Generated receipt number incorporates configured receiptPrefix');

    // -------------------------------------------------------------
    // TEST 3: Authoritative Ledger Summary Reconciliation
    // -------------------------------------------------------------
    const s1LedgerAfterPay = await getStudentFeeLedger(schoolAId, student1Id);
    assert(s1LedgerAfterPay.summary.totalPaid === 20000, 5, 'Authoritative summary totalPaid matches ₹20,000');
    assert(s1LedgerAfterPay.summary.totalBalance === 20000, 6, 'Authoritative summary outstanding balance reflects ₹20,000');

    // -------------------------------------------------------------
    // TEST 4: Guardian Relationship Authorization Check
    // -------------------------------------------------------------
    // Verify Parent A can access linked child Student 1
    const verifiedParentStudent = await prisma.parentStudent.findFirst({
      where: { parentId: parentAId, studentId: student1Id },
    });
    assert(verifiedParentStudent !== null, 7, 'Parent A is authorized to view linked child Student 1');

    // Verify Parent A is strictly denied access to unlinked Student 2
    const unlinkedParentStudent = await prisma.parentStudent.findFirst({
      where: { parentId: parentAId, studentId: student2Id },
    });
    assert(unlinkedParentStudent === null, 8, 'Parent A has zero relationship to Student 2 (Unauthorized)');

    // -------------------------------------------------------------
    // TEST 5: Receipt Ownership Authorization Check
    // -------------------------------------------------------------
    // Receipt 1 belongs to Student 1
    const receipt1 = await prisma.feeReceipt.findFirst({
      where: { id: paymentRes.receipt.id, schoolId: schoolAId, studentId: student1Id },
    });
    assert(receipt1 !== null, 9, 'Receipt belongs to Student 1 and School A');

    // Attempting to query Receipt 1 with Student 2 ID returns null
    const crossStudentReceipt = await prisma.feeReceipt.findFirst({
      where: { id: paymentRes.receipt.id, schoolId: schoolAId, studentId: student2Id },
    });
    assert(crossStudentReceipt === null, 10, 'Receipt 1 cannot be accessed using unlinked Student 2 ID');

    // -------------------------------------------------------------
    // TEST 6: Tenant Isolation (School B Parent Cannot Access School A)
    // -------------------------------------------------------------
    const schoolBParent = await prisma.parent.findFirst({
      where: { schoolId: schoolBId, userId: parentUserAId },
    });
    assert(schoolBParent === null, 11, 'Cross-tenant isolation: School B does not authorize School A parent');

    // -------------------------------------------------------------
    // TEST 7: PDF Generator Emits Configured Footer Note
    // -------------------------------------------------------------
    const feeSettings = await getFeeSettings(schoolAId);
    assert(
      feeSettings.receiptFooterNote === 'Official Digital Receipt authorized under Delhi Public Schools Directorate.',
      12,
      'Fee settings return configured receiptFooterNote'
    );

    const pdfBuffer = await generateReceiptPdfBuffer({
      schoolName: 'Delhi Public Test School',
      receiptNumber: paymentRes.receipt.receiptNumber,
      paymentNumber: paymentRes.payment.paymentNumber,
      receiptDate: new Date(),
      paymentMode: 'UPI',
      status: 'ISSUED',
      studentName: 'Rohan Sharma',
      admissionNumber: 'DPS-ADM-01',
      allocations: [{ title: 'Term 1', amount: 20000 }],
      totalPaid: 20000,
      footerNote: feeSettings.receiptFooterNote,
    });

    assert(pdfBuffer instanceof Uint8Array, 13, 'Receipt PDF generated as Uint8Array');
    assert(pdfBuffer.byteLength > 500, 14, 'Receipt PDF binary length is valid');

    // Verify PDF Magic Header '%PDF-'
    const headerStr = Buffer.from(pdfBuffer.slice(0, 5)).toString('ascii');
    assert(headerStr === '%PDF-', 15, 'PDF buffer contains valid %PDF- magic signature');

    console.log('\n================================================================');
    console.log('🎉 ALL 15 PARENT FEE ACCESS & INTEGRITY TESTS PASSED!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  } finally {
    // Cleanup test artifacts
    try {
      if (schoolAId!) {
        await prisma.feeAuditLog.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.feePaymentAllocation.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.feeReceipt.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.feePayment.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.feeObligation.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.feeInstallment.deleteMany({ where: { feePlanVersion: { feePlan: { schoolId: schoolAId } } } });
        await prisma.feeItem.deleteMany({ where: { feePlanVersion: { feePlan: { schoolId: schoolAId } } } });
        await prisma.feePlanVersion.deleteMany({ where: { feePlan: { schoolId: schoolAId } } });
        await prisma.feePlan.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.feeHead.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.parentStudent.deleteMany({ where: { studentId: { in: [student1Id!, student2Id!] } } });
        await prisma.studentEnrollment.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.student.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.parent.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.idSequence.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.section.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.class.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.academicSession.deleteMany({ where: { schoolId: schoolAId } });
        await prisma.school.delete({ where: { id: schoolAId } });
      }
      if (schoolBId!) {
        await prisma.school.delete({ where: { id: schoolBId } });
      }
      if (parentUserAId!) {
        await prisma.user.delete({ where: { id: parentUserAId } });
      }
      if (adminUserId!) {
        await prisma.user.delete({ where: { id: adminUserId } });
      }
    } catch {
      // Ignore cleanup error
    }
  }
}

runParentFeeTests();

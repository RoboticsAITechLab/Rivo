import { prisma } from '@/lib/prisma';
import {
  FeePaymentMode,
  FeePaymentStatus,
  FeeReceiptStatus,
  FeeObligationStatus,
  Prisma,
} from '@prisma/client';
import {
  generateNextPaymentNumber,
  generateNextReceiptNumber,
} from '@/lib/id-generator';

export interface RecordPaymentInput {
  academicSessionId: string;
  studentId: string;
  studentEnrollmentId: string;
  amount: number;
  paymentMode: FeePaymentMode;
  paymentDate?: string | Date;
  referenceNumber?: string | null;
  bankName?: string | null;
  chequeDate?: string | Date | null;
  remarks?: string | null;
  // Optional specific obligations allocation; if omitted, oldest-due-first is applied
  allocations?: Array<{
    obligationId: string;
    amount: number;
  }>;
}

export interface ReversePaymentInput {
  paymentId: string;
  reversalReason: string;
}

/**
 * Records a financial payment against student fee obligations in a single atomic transaction.
 * Generates authoritative payment ID and receipt ID, applies allocation, and freezes student snapshot.
 */
export async function recordFeePayment(
  schoolId: string,
  data: RecordPaymentInput,
  userId: string
) {
  const paymentAmount = new Prisma.Decimal(data.amount);
  if (paymentAmount.lessThanOrEqualTo(0)) {
    throw new Error('Payment amount must be greater than zero.');
  }

  // 1. Verify student and active enrollment belong to this school
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      id: data.studentEnrollmentId,
      studentId: data.studentId,
      schoolId,
      academicSessionId: data.academicSessionId,
    },
    include: {
      student: {
        include: {
          parentStudents: {
            include: { parent: true },
            where: { isPrimaryContact: true },
          },
        },
      },
      class: true,
      section: true,
      academicSession: true,
    },
  });

  if (!enrollment) {
    throw new Error('Valid student enrollment not found for this school and session.');
  }

  // Generate sequential Payment ID and Receipt ID before entering the atomic settlement transaction
  const year = new Date().getFullYear();
  const paymentNumber = await generateNextPaymentNumber(schoolId, { year });
  const receiptNumber = await generateNextReceiptNumber(schoolId, { year });

  return prisma.$transaction(async (tx) => {
    // 2. Resolve outstanding obligations
    const pendingObligations = await tx.feeObligation.findMany({
      where: {
        schoolId,
        studentEnrollmentId: enrollment.id,
        status: { in: [FeeObligationStatus.PENDING, FeeObligationStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: 0 },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (pendingObligations.length === 0) {
      throw new Error('No outstanding fee obligations found for this student enrollment.');
    }

    const totalOutstanding = pendingObligations.reduce(
      (sum, ob) => sum.add(ob.balanceAmount),
      new Prisma.Decimal(0)
    );

    if (paymentAmount.greaterThan(totalOutstanding)) {
      throw new Error(
        `Payment amount (₹${paymentAmount}) exceeds total outstanding balance (₹${totalOutstanding}). Overpayment is not permitted.`
      );
    }

    // 3. Determine allocation plan
    const allocationPlan: Array<{ obligation: typeof pendingObligations[0]; amount: Prisma.Decimal }> = [];

    if (data.allocations && data.allocations.length > 0) {
      // Explicit manual allocation requested
      let explicitSum = new Prisma.Decimal(0);
      for (const reqAlloc of data.allocations) {
        const ob = pendingObligations.find((o) => o.id === reqAlloc.obligationId);
        if (!ob) {
          throw new Error(`Obligation '${reqAlloc.obligationId}' not found among outstanding dues.`);
        }
        const allocDec = new Prisma.Decimal(reqAlloc.amount);
        if (allocDec.lessThanOrEqualTo(0)) {
          throw new Error(`Allocation for obligation '${ob.title}' must be positive.`);
        }
        if (allocDec.greaterThan(ob.balanceAmount)) {
          throw new Error(
            `Allocated amount (₹${allocDec}) exceeds remaining balance (₹${ob.balanceAmount}) for '${ob.title}'.`
          );
        }
        explicitSum = explicitSum.add(allocDec);
        allocationPlan.push({ obligation: ob, amount: allocDec });
      }

      if (!explicitSum.equals(paymentAmount)) {
        throw new Error(
          `Sum of manual allocations (₹${explicitSum}) does not match total payment amount (₹${paymentAmount}).`
        );
      }
    } else {
      // Default: Oldest due first
      let unallocated = paymentAmount;
      for (const ob of pendingObligations) {
        if (unallocated.equals(0)) break;

        const payableToThis = unallocated.greaterThanOrEqualTo(ob.balanceAmount)
          ? ob.balanceAmount
          : unallocated;

        allocationPlan.push({ obligation: ob, amount: payableToThis });
        unallocated = unallocated.minus(payableToThis);
      }
    }

    // 4. Create FeePayment record
    const payment = await tx.feePayment.create({
      data: {
        schoolId,
        academicSessionId: data.academicSessionId,
        studentId: data.studentId,
        studentEnrollmentId: data.studentEnrollmentId,
        paymentNumber,
        amount: paymentAmount,
        paymentMode: data.paymentMode,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        status: FeePaymentStatus.COLLECTED,
        referenceNumber: data.referenceNumber?.trim() || null,
        bankName: data.bankName?.trim() || null,
        chequeDate: data.chequeDate ? new Date(data.chequeDate) : null,
        remarks: data.remarks?.trim() || null,
        collectedByUserId: userId,
      },
    });

    // 6. Execute allocations & update obligation balances
    const allocationSnapshots: any[] = [];

    for (const alloc of allocationPlan) {
      await tx.feePaymentAllocation.create({
        data: {
          schoolId,
          paymentId: payment.id,
          obligationId: alloc.obligation.id,
          allocatedAmount: alloc.amount,
          isReversed: false,
        },
      });

      const newPaid = alloc.obligation.paidAmount.add(alloc.amount);
      const newBalance = alloc.obligation.netAmount.minus(newPaid);
      const newStatus = newBalance.equals(0)
        ? FeeObligationStatus.PAID
        : FeeObligationStatus.PARTIALLY_PAID;

      await tx.feeObligation.update({
        where: { id: alloc.obligation.id },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      });

      allocationSnapshots.push({
        obligationId: alloc.obligation.id,
        title: alloc.obligation.title,
        dueDate: alloc.obligation.dueDate.toISOString().split('T')[0],
        allocatedAmount: alloc.amount.toString(),
        remainingObligationBalance: newBalance.toString(),
        obligationStatus: newStatus,
      });
    }

    // 7. Prepare immutable student snapshot for legal receipt
    const primaryParent = enrollment.student.parentStudents[0]?.parent;
    const parentName = primaryParent
      ? `${primaryParent.firstName} ${primaryParent.lastName}`.trim()
      : 'N/A';

    const studentSnapshot = {
      studentId: enrollment.student.id,
      admissionNumber: enrollment.student.admissionNumber,
      rollNumber: enrollment.rollNumber || 'N/A',
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim(),
      fatherOrGuardianName: parentName,
      className: enrollment.class.name,
      sectionName: enrollment.section.name,
      stream: enrollment.student.stream || 'General',
      academicSessionName: enrollment.academicSession.name,
    };

    // 8. Atomically create FeeReceipt
    const receipt = await tx.feeReceipt.create({
      data: {
        schoolId,
        academicSessionId: data.academicSessionId,
        studentId: data.studentId,
        studentEnrollmentId: data.studentEnrollmentId,
        paymentId: payment.id,
        receiptNumber,
        receiptDate: payment.paymentDate,
        totalPaid: paymentAmount,
        paymentMode: data.paymentMode,
        referenceNumber: payment.referenceNumber,
        studentSnapshot,
        allocationSnapshot: allocationSnapshots,
        issuedByUserId: userId,
        status: FeeReceiptStatus.ISSUED,
      },
    });

    // 9. Financial Audit Log
    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'PAYMENT_COLLECTED',
        entityType: 'FeePayment',
        entityId: payment.id,
        performedByUserId: userId,
        details: JSON.stringify({
          paymentNumber,
          receiptNumber,
          amount: paymentAmount.toString(),
          paymentMode: data.paymentMode,
          studentAdmissionNumber: enrollment.student.admissionNumber,
          allocationsCount: allocationPlan.length,
        }),
      },
    });

    return {
      payment,
      receipt,
      allocationsCount: allocationPlan.length,
    };
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Reverses a previously collected fee payment without deleting any financial records.
 * Rolls back affected obligation balances and cancels the associated receipt.
 */
export async function reverseFeePayment(
  schoolId: string,
  params: ReversePaymentInput,
  userId: string
) {
  const { paymentId, reversalReason } = params;

  if (!reversalReason || reversalReason.trim().length < 5) {
    throw new Error('A detailed reversal reason (at least 5 characters) must be provided.');
  }

  const payment = await prisma.feePayment.findFirst({
    where: {
      id: paymentId,
      schoolId,
    },
    include: {
      allocations: {
        where: { isReversed: false },
        include: { obligation: true },
      },
      receipt: true,
    },
  });

  if (!payment) {
    throw new Error('Payment record not found.');
  }

  if (payment.status === FeePaymentStatus.REVERSED) {
    throw new Error('This payment has already been reversed.');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Mark payment as REVERSED
    const updatedPayment = await tx.feePayment.update({
      where: { id: payment.id },
      data: {
        status: FeePaymentStatus.REVERSED,
        reversedAt: new Date(),
        reversedByUserId: userId,
        reversalReason: reversalReason.trim(),
      },
    });

    // 2. Reverse allocations and roll back obligation balances
    for (const alloc of payment.allocations) {
      await tx.feePaymentAllocation.update({
        where: { id: alloc.id },
        data: { isReversed: true },
      });

      const ob = alloc.obligation;
      const rolledBackPaid = ob.paidAmount.minus(alloc.allocatedAmount);
      const rolledBackBalance = ob.netAmount.minus(rolledBackPaid);
      const rolledBackStatus = rolledBackPaid.equals(0)
        ? (ob.netAmount.equals(0) ? FeeObligationStatus.WAIVED : FeeObligationStatus.PENDING)
        : FeeObligationStatus.PARTIALLY_PAID;

      await tx.feeObligation.update({
        where: { id: ob.id },
        data: {
          paidAmount: rolledBackPaid,
          balanceAmount: rolledBackBalance,
          status: rolledBackStatus,
        },
      });
    }

    // 3. Mark receipt as CANCELLED
    if (payment.receipt) {
      await tx.feeReceipt.update({
        where: { id: payment.receipt.id },
        data: {
          status: FeeReceiptStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledByUserId: userId,
          cancellationReason: reversalReason.trim(),
        },
      });
    }

    // 4. Financial Audit Log
    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'PAYMENT_REVERSED',
        entityType: 'FeePayment',
        entityId: payment.id,
        performedByUserId: userId,
        details: JSON.stringify({
          paymentNumber: payment.paymentNumber,
          reversalReason: reversalReason.trim(),
          amount: payment.amount.toString(),
          receiptNumber: payment.receipt?.receiptNumber || null,
        }),
      },
    });

    return updatedPayment;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Retrieves the full financial fee ledger for a student within an academic session.
 */
export async function getStudentFeeLedger(
  schoolId: string,
  studentId: string,
  academicSessionId?: string
) {
  const obligations = await prisma.feeObligation.findMany({
    where: {
      schoolId,
      studentId,
      ...(academicSessionId ? { academicSessionId } : {}),
    },
    include: {
      academicSession: { select: { id: true, name: true } },
      allocations: {
        where: { isReversed: false },
        include: {
          payment: {
            select: {
              id: true,
              paymentNumber: true,
              paymentDate: true,
              paymentMode: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const payments = await prisma.feePayment.findMany({
    where: {
      schoolId,
      studentId,
      ...(academicSessionId ? { academicSessionId } : {}),
    },
    include: {
      receipt: true,
      allocations: {
        include: { obligation: { select: { id: true, title: true } } },
      },
    },
    orderBy: { paymentDate: 'desc' },
  });

  const assignments = await prisma.studentFeeAssignment.findMany({
    where: {
      schoolId,
      studentId,
      ...(academicSessionId ? { academicSessionId } : {}),
    },
    include: {
      feePlanVersion: {
        include: { feePlan: true, items: true, installments: true },
      },
    },
  });

  // Calculate totals
  let totalOriginal = new Prisma.Decimal(0);
  let totalConcessions = new Prisma.Decimal(0);
  let totalNet = new Prisma.Decimal(0);
  let totalPaid = new Prisma.Decimal(0);
  let totalBalance = new Prisma.Decimal(0);

  for (const ob of obligations) {
    if (ob.status !== FeeObligationStatus.CANCELLED) {
      totalOriginal = totalOriginal.add(ob.originalAmount);
      totalConcessions = totalConcessions.add(ob.concessionAmount);
      totalNet = totalNet.add(ob.netAmount);
      totalPaid = totalPaid.add(ob.paidAmount);
      totalBalance = totalBalance.add(ob.balanceAmount);
    }
  }

  return {
    studentId,
    summary: {
      totalOriginal: totalOriginal.toNumber(),
      totalConcessions: totalConcessions.toNumber(),
      totalNet: totalNet.toNumber(),
      totalPaid: totalPaid.toNumber(),
      totalBalance: totalBalance.toNumber(),
    },
    assignments,
    obligations,
    payments,
  };
}

/**
 * Retrieves authoritative receipt data suitable for high-fidelity printing or display.
 */
export async function getReceiptPrintData(schoolId: string, receiptId: string) {
  const receipt = await prisma.feeReceipt.findFirst({
    where: {
      id: receiptId,
      schoolId,
    },
    include: {
      school: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          address: true,
          phone: true,
          email: true,
          website: true,
        },
      },
      payment: true,
      student: { select: { id: true, admissionNumber: true, email: true, phone: true } },
    },
  });

  if (!receipt) {
    throw new Error('Receipt not found.');
  }

  return receipt;
}

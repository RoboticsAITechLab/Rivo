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
import { getFeeSettings } from '@/lib/settings/settings-service';


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

  const feeSettings = await getFeeSettings(schoolId);

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
        `Payment amount (${feeSettings.currencySymbol}${paymentAmount}) exceeds total outstanding balance (${feeSettings.currencySymbol}${totalOutstanding}). Overpayment is not permitted.`
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
            `Allocated amount (${feeSettings.currencySymbol}${allocDec}) exceeds remaining balance (${feeSettings.currencySymbol}${ob.balanceAmount}) for '${ob.title}'.`
          );
        }
        explicitSum = explicitSum.add(allocDec);
        allocationPlan.push({ obligation: ob, amount: allocDec });
      }

      if (!explicitSum.equals(paymentAmount)) {
        throw new Error(
          `Sum of manual allocations (${feeSettings.currencySymbol}${explicitSum}) does not match total payment amount (${feeSettings.currencySymbol}${paymentAmount}).`
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
      issuedByUser: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!receipt) {
    throw new Error('Receipt not found.');
  }

  return receipt;
}

export interface ApplyAdHocConcessionInput {
  studentId: string;
  studentEnrollmentId: string;
  academicSessionId: string;
  type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  rateOrAmount: number;
  category: string;
  reason: string;
  obligationIds?: string[]; // If specified, apply to these obligations; otherwise oldest outstanding
}

export interface ReverseAdHocConcessionInput {
  obligationId: string;
  reversalReason: string;
}

/**
 * Grants an auditable mid-year fee concession or waiver against a student's existing unpaid obligations.
 * Does NOT mutate the master FeePlan or historical payments.
 * Wrapped in an atomic transaction to ensure Decimal arithmetic safety and concurrency protection.
 */
export async function applyAdHocConcession(
  schoolId: string,
  params: ApplyAdHocConcessionInput,
  userId: string
) {
  const {
    studentId,
    studentEnrollmentId,
    academicSessionId,
    type,
    rateOrAmount,
    category,
    reason,
    obligationIds,
  } = params;

  if (rateOrAmount <= 0) {
    throw new Error('Concession amount or percentage must be greater than zero.');
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error('A detailed justification reason (at least 5 characters) is mandatory.');
  }

  // Verify student enrollment exists and belongs to this school
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      id: studentEnrollmentId,
      studentId,
      schoolId,
      academicSessionId,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      class: { select: { name: true } },
    },
  });

  if (!enrollment) {
    throw new Error('Student enrollment record not found for this school and session.');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Fetch eligible obligations (with balanceAmount > 0 and not CANCELLED)
    const whereClause: any = {
      schoolId,
      studentId,
      studentEnrollmentId,
      academicSessionId,
      status: { not: FeeObligationStatus.CANCELLED },
      balanceAmount: { gt: 0 },
    };

    if (obligationIds && obligationIds.length > 0) {
      whereClause.id = { in: obligationIds };
    }

    const eligibleObligations = await tx.feeObligation.findMany({
      where: whereClause,
      orderBy: { dueDate: 'asc' },
    });

    if (eligibleObligations.length === 0) {
      throw new Error('No eligible fee obligations with an outstanding balance were found.');
    }

    // 2. Determine concession distribution across target obligations
    const updates: Array<{
      obligation: typeof eligibleObligations[0];
      concessionToApply: Prisma.Decimal;
      newConcessionAmount: Prisma.Decimal;
      newNetAmount: Prisma.Decimal;
      newBalanceAmount: Prisma.Decimal;
      newStatus: FeeObligationStatus;
    }> = [];

    let totalAppliedConcession = new Prisma.Decimal(0);

    if (type === 'PERCENTAGE') {
      const percentage = Number(rateOrAmount);
      if (percentage <= 0 || percentage > 100) {
        throw new Error('Percentage concession rate must be between 1 and 100.');
      }

      for (const ob of eligibleObligations) {
        // Percentage is calculated against originalAmount, capped at remaining balanceAmount
        const calculated = ob.originalAmount
          .mul(percentage)
          .div(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        const concessionToApply = Prisma.Decimal.min(calculated, ob.balanceAmount);

        if (concessionToApply.greaterThan(0)) {
          const newConcessionAmount = ob.concessionAmount.add(concessionToApply);
          const newNetAmount = ob.originalAmount.minus(newConcessionAmount);
          const newBalanceAmount = ob.balanceAmount.minus(concessionToApply);
          const newStatus = newBalanceAmount.equals(0)
            ? (ob.paidAmount.greaterThan(0) ? FeeObligationStatus.PAID : FeeObligationStatus.WAIVED)
            : ob.status;

          updates.push({
            obligation: ob,
            concessionToApply,
            newConcessionAmount,
            newNetAmount,
            newBalanceAmount,
            newStatus,
          });
          totalAppliedConcession = totalAppliedConcession.add(concessionToApply);
        }
      }
    } else {
      // FIXED_AMOUNT: Sequential allocation across eligible obligations
      let remainingToAllocate = new Prisma.Decimal(rateOrAmount);

      // Check total available balance across selected obligations
      const totalAvailableBalance = eligibleObligations.reduce(
        (sum, ob) => sum.add(ob.balanceAmount),
        new Prisma.Decimal(0)
      );

      if (remainingToAllocate.greaterThan(totalAvailableBalance)) {
        throw new Error(
          `Requested concession of ₹${remainingToAllocate} exceeds total eligible outstanding balance of ₹${totalAvailableBalance}.`
        );
      }

      for (const ob of eligibleObligations) {
        if (remainingToAllocate.lessThanOrEqualTo(0)) break;

        const concessionToApply = Prisma.Decimal.min(remainingToAllocate, ob.balanceAmount);
        const newConcessionAmount = ob.concessionAmount.add(concessionToApply);
        const newNetAmount = ob.originalAmount.minus(newConcessionAmount);
        const newBalanceAmount = ob.balanceAmount.minus(concessionToApply);
        const newStatus = newBalanceAmount.equals(0)
          ? (ob.paidAmount.greaterThan(0) ? FeeObligationStatus.PAID : FeeObligationStatus.WAIVED)
          : ob.status;

        updates.push({
          obligation: ob,
          concessionToApply,
          newConcessionAmount,
          newNetAmount,
          newBalanceAmount,
          newStatus,
        });

        remainingToAllocate = remainingToAllocate.minus(concessionToApply);
        totalAppliedConcession = totalAppliedConcession.add(concessionToApply);
      }
    }

    if (updates.length === 0 || totalAppliedConcession.equals(0)) {
      throw new Error('Unable to apply concession: calculated adjustment amount is ₹0.');
    }

    // 3. Persist obligation updates atomically
    const affectedObligationDetails = [];

    for (const item of updates) {
      await tx.feeObligation.update({
        where: { id: item.obligation.id },
        data: {
          concessionAmount: item.newConcessionAmount,
          netAmount: item.newNetAmount,
          balanceAmount: item.newBalanceAmount,
          status: item.newStatus,
        },
      });

      affectedObligationDetails.push({
        obligationId: item.obligation.id,
        obligationTitle: item.obligation.title,
        concessionApplied: item.concessionToApply.toNumber(),
        beforeBalance: item.obligation.balanceAmount.toNumber(),
        afterBalance: item.newBalanceAmount.toNumber(),
        status: item.newStatus,
      });
    }

    // 4. Update total custom concession amount on the parent StudentFeeAssignment
    // We increment customConcessionAmount on the active assignment for this session
    const primaryAssignment = await tx.studentFeeAssignment.findFirst({
      where: {
        schoolId,
        studentId,
        studentEnrollmentId,
        academicSessionId,
        status: 'ACTIVE',
      },
    });

    if (primaryAssignment) {
      await tx.studentFeeAssignment.update({
        where: { id: primaryAssignment.id },
        data: {
          customConcessionAmount: primaryAssignment.customConcessionAmount.add(totalAppliedConcession),
          concessionReason: primaryAssignment.concessionReason
            ? `${primaryAssignment.concessionReason} | [Mid-Year Concession: ₹${totalAppliedConcession} - ${reason.trim()}]`
            : `[Mid-Year Concession: ₹${totalAppliedConcession} - ${reason.trim()}]`,
        },
      });
    }

    // 5. Append immutable FeeAuditLog
    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'CONCESSION_APPLIED',
        entityType: 'FeeObligation',
        entityId: eligibleObligations[0].id,
        performedByUserId: userId,
        details: JSON.stringify({
          action: 'CONCESSION_GRANTED',
          studentId,
          studentEnrollmentId,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim(),
          admissionNumber: enrollment.student.admissionNumber,
          type,
          rateOrAmount,
          category,
          reason: reason.trim(),
          totalAppliedConcession: totalAppliedConcession.toNumber(),
          affectedObligations: affectedObligationDetails,
        }),
      },
    });

    return {
      success: true,
      totalAppliedConcession: totalAppliedConcession.toNumber(),
      affectedObligations: affectedObligationDetails,
    };
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Reverses an applied concession from a specific obligation, restoring its balance.
 */
export async function reverseAdHocConcession(
  schoolId: string,
  params: ReverseAdHocConcessionInput,
  userId: string
) {
  const { obligationId, reversalReason } = params;

  if (!reversalReason || reversalReason.trim().length < 5) {
    throw new Error('A detailed reversal explanation (at least 5 characters) is required.');
  }

  return prisma.$transaction(async (tx) => {
    const ob = await tx.feeObligation.findFirst({
      where: { id: obligationId, schoolId },
      include: {
        assignment: true,
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
      },
    });

    if (!ob) {
      throw new Error('Fee obligation record not found for this school.');
    }

    if (ob.concessionAmount.lessThanOrEqualTo(0)) {
      throw new Error('This obligation has no active concession to reverse.');
    }

    const reversedAmount = ob.concessionAmount;
    const newConcessionAmount = new Prisma.Decimal(0);
    const newNetAmount = ob.originalAmount;
    const newBalanceAmount = ob.balanceAmount.add(reversedAmount);
    const newStatus = ob.paidAmount.greaterThan(0)
      ? (newBalanceAmount.equals(0) ? FeeObligationStatus.PAID : FeeObligationStatus.PARTIALLY_PAID)
      : FeeObligationStatus.PENDING;

    await tx.feeObligation.update({
      where: { id: ob.id },
      data: {
        concessionAmount: newConcessionAmount,
        netAmount: newNetAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      },
    });

    // Update assignment record if exists
    if (ob.assignment) {
      const currentConcession = ob.assignment.customConcessionAmount;
      const updatedConcession = Prisma.Decimal.max(0, currentConcession.minus(reversedAmount));
      await tx.studentFeeAssignment.update({
        where: { id: ob.assignment.id },
        data: {
          customConcessionAmount: updatedConcession,
          concessionReason: ob.assignment.concessionReason
            ? `${ob.assignment.concessionReason} | [Concession Reversed: ₹${reversedAmount} - ${reversalReason.trim()}]`
            : `[Concession Reversed: ₹${reversedAmount} - ${reversalReason.trim()}]`,
        },
      });
    }

    // Append audit log
    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'CONCESSION_APPLIED',
        entityType: 'FeeObligation',
        entityId: ob.id,
        performedByUserId: userId,
        details: JSON.stringify({
          action: 'CONCESSION_REVERSED',
          obligationId: ob.id,
          obligationTitle: ob.title,
          studentId: ob.studentId,
          reversedAmount: reversedAmount.toNumber(),
          reversalReason: reversalReason.trim(),
          restoredBalance: newBalanceAmount.toNumber(),
        }),
      },
    });

    return {
      success: true,
      reversedAmount: reversedAmount.toNumber(),
      restoredBalance: newBalanceAmount.toNumber(),
    };
  }, { maxWait: 15000, timeout: 30000 });
}

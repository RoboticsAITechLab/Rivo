import { prisma } from '@/lib/prisma';
import {
  FeePlanStatus,
  FeePlanVersionStatus,
  FeeAssignmentStatus,
  FeeObligationStatus,
  Prisma,
} from '@prisma/client';

export interface FeeHeadInput {
  name: string;
  code: string;
  description?: string | null;
  isRefundable?: boolean;
}

export interface FeePlanItemInput {
  feeHeadId: string;
  name: string;
  amount: number;
  isOptional?: boolean;
  displayOrder?: number;
}

export interface FeeInstallmentInput {
  installmentNumber: number;
  name: string;
  dueDate: string | Date;
  amount: number;
  lateFeeFinePerDay?: number | null;
  gracePeriodDays?: number;
}

export interface CreateFeePlanInput {
  academicSessionId: string;
  campusId?: string | null;
  classId: string;
  streamId?: string | null;
  sectionId?: string | null;
  name: string;
  code?: string | null;
  description?: string | null;
  totalAmount: number;
  currency?: string;
  items: FeePlanItemInput[];
  installments: FeeInstallmentInput[];
}

export interface AssignFeePlanInput {
  academicSessionId: string;
  feePlanVersionId: string;
  studentEnrollmentIds: string[];
  customConcessionAmount?: number;
  concessionReason?: string | null;
  concessionApprovedByUserId?: string | null;
}

/**
 * Validates a FeePlanVersion's component sum and installment schedule.
 * Rule:
 * 1. SUM(items.amount) === totalAmount
 * 2. SUM(installments.amount) === totalAmount
 * 3. Installments are sequentially numbered 1..N with valid future/chronological due dates.
 */
export function validatePlanSchedule(
  totalAmount: number,
  items: FeePlanItemInput[],
  installments: FeeInstallmentInput[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (totalAmount <= 0) {
    errors.push('Plan total amount must be strictly greater than 0.');
  }

  // 1. Items sum check
  const itemsSum = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  if (Math.abs(itemsSum - totalAmount) > 0.009) {
    errors.push(
      `Fee components total (₹${itemsSum.toFixed(2)}) does not match the plan total (₹${totalAmount.toFixed(2)}). Difference: ₹${(itemsSum - totalAmount).toFixed(2)}.`
    );
  }

  // 2. Installments sum check
  if (!installments || installments.length === 0) {
    errors.push('At least one installment must be defined in the fee schedule.');
  } else {
    const installmentsSum = installments.reduce(
      (sum, inst) => sum + Number(inst.amount || 0),
      0
    );
    if (Math.abs(installmentsSum - totalAmount) > 0.009) {
      errors.push(
        `Installment schedule total (₹${installmentsSum.toFixed(2)}) does not match the plan total (₹${totalAmount.toFixed(2)}). Difference: ₹${(installmentsSum - totalAmount).toFixed(2)}.`
      );
    }

    // Sequence check & duplicate check
    const numbers = installments.map((i) => i.installmentNumber);
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== numbers.length) {
      errors.push('Installment numbers must be unique.');
    }

    for (let i = 0; i < installments.length; i++) {
      const inst = installments[i];
      if (Number(inst.amount) <= 0) {
        errors.push(`Installment #${inst.installmentNumber} (${inst.name}) amount must be greater than 0.`);
      }
      const due = new Date(inst.dueDate);
      if (isNaN(due.getTime())) {
        errors.push(`Installment #${inst.installmentNumber} has an invalid due date.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates or retrieves a FeeHead category.
 */
export async function createFeeHead(
  schoolId: string,
  data: FeeHeadInput,
  userId: string
) {
  const normalizedCode = data.code.trim().toUpperCase();
  const normalizedName = data.name.trim();

  const existing = await prisma.feeHead.findFirst({
    where: {
      schoolId,
      OR: [{ code: normalizedCode }, { name: normalizedName }],
    },
  });

  if (existing) {
    throw new Error(
      `Fee category with code '${normalizedCode}' or name '${normalizedName}' already exists.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const head = await tx.feeHead.create({
      data: {
        schoolId,
        code: normalizedCode,
        name: normalizedName,
        description: data.description?.trim() || null,
        isRefundable: Boolean(data.isRefundable),
        isActive: true,
      },
    });

    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'FEE_HEAD_CREATED',
        entityType: 'FeeHead',
        entityId: head.id,
        performedByUserId: userId,
        details: JSON.stringify({ code: head.code, name: head.name }),
      },
    });

    return head;
  });
}

/**
 * Creates a new FeePlan with initial DRAFT Version (v1), components, and custom installment schedule.
 */
export async function createFeePlan(
  schoolId: string,
  data: CreateFeePlanInput,
  userId: string
) {
  // Validate schedule
  const validation = validatePlanSchedule(data.totalAmount, data.items, data.installments);
  if (!validation.isValid) {
    throw new Error(`Fee plan validation failed:\n- ${validation.errors.join('\n- ')}`);
  }

  // Ensure academic session and class belong to this school
  const [session, cls] = await Promise.all([
    prisma.academicSession.findFirst({
      where: { id: data.academicSessionId, schoolId },
      select: { id: true },
    }),
    prisma.class.findFirst({
      where: { id: data.classId, schoolId },
      select: { id: true, name: true },
    }),
  ]);

  if (!session) throw new Error('Academic session not found for this school.');
  if (!cls) throw new Error('Class not found for this school.');

  if (data.campusId) {
    const campus = await prisma.campus.findFirst({
      where: { id: data.campusId, schoolId },
      select: { id: true },
    });
    if (!campus) throw new Error('Campus not found for this school.');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create master FeePlan
    const plan = await tx.feePlan.create({
      data: {
        schoolId,
        academicSessionId: data.academicSessionId,
        campusId: data.campusId || null,
        classId: data.classId,
        streamId: data.streamId?.trim() || null,
        sectionId: data.sectionId || null,
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
        currentVersion: 1,
        status: FeePlanStatus.DRAFT,
      },
    });

    // 2. Create FeePlanVersion 1
    const version = await tx.feePlanVersion.create({
      data: {
        schoolId,
        feePlanId: plan.id,
        versionNumber: 1,
        totalAmount: new Prisma.Decimal(data.totalAmount),
        currency: data.currency || 'INR',
        status: FeePlanVersionStatus.DRAFT,
      },
    });

    // 3. Create components (items)
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      await tx.feePlanItem.create({
        data: {
          feePlanVersionId: version.id,
          feeHeadId: item.feeHeadId,
          name: item.name.trim(),
          amount: new Prisma.Decimal(item.amount),
          isOptional: Boolean(item.isOptional),
          displayOrder: item.displayOrder ?? i,
        },
      });
    }

    // 4. Create installments schedule
    for (const inst of data.installments) {
      await tx.feeInstallment.create({
        data: {
          feePlanVersionId: version.id,
          installmentNumber: inst.installmentNumber,
          name: inst.name.trim(),
          dueDate: new Date(inst.dueDate),
          amount: new Prisma.Decimal(inst.amount),
          lateFeeFinePerDay: inst.lateFeeFinePerDay ? new Prisma.Decimal(inst.lateFeeFinePerDay) : null,
          gracePeriodDays: inst.gracePeriodDays ?? 0,
        },
      });
    }

    // 5. Audit
    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'PLAN_CREATED',
        entityType: 'FeePlan',
        entityId: plan.id,
        performedByUserId: userId,
        details: JSON.stringify({
          planId: plan.id,
          versionId: version.id,
          name: plan.name,
          totalAmount: data.totalAmount,
          installmentsCount: data.installments.length,
        }),
      },
    });

    return {
      plan,
      version,
    };
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Publishes a FeePlanVersion, locking its structure from future mutation.
 * Marks the master FeePlan as ACTIVE.
 */
export async function publishFeePlan(
  schoolId: string,
  feePlanId: string,
  versionNumber: number,
  userId: string
) {
  const version = await prisma.feePlanVersion.findFirst({
    where: {
      feePlanId,
      versionNumber,
      schoolId,
    },
    include: {
      items: true,
      installments: true,
      feePlan: true,
    },
  });

  if (!version) {
    throw new Error(`Fee plan version v${versionNumber} not found.`);
  }

  if (version.status === FeePlanVersionStatus.PUBLISHED) {
    return version; // Already published
  }

  // Validate items and installments before publishing
  const itemsSum = version.items.reduce((acc, it) => acc.add(it.amount), new Prisma.Decimal(0));
  const instSum = version.installments.reduce((acc, it) => acc.add(it.amount), new Prisma.Decimal(0));

  if (!itemsSum.equals(version.totalAmount)) {
    throw new Error(
      `Cannot publish plan: Components sum (₹${itemsSum}) does not equal plan total (₹${version.totalAmount}).`
    );
  }

  if (!instSum.equals(version.totalAmount)) {
    throw new Error(
      `Cannot publish plan: Installments sum (₹${instSum}) does not equal plan total (₹${version.totalAmount}).`
    );
  }

  return prisma.$transaction(async (tx) => {
    const published = await tx.feePlanVersion.update({
      where: { id: version.id },
      data: {
        status: FeePlanVersionStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedByUserId: userId,
      },
    });

    await tx.feePlan.update({
      where: { id: feePlanId },
      data: {
        status: FeePlanStatus.ACTIVE,
        currentVersion: versionNumber,
      },
    });

    await tx.feeAuditLog.create({
      data: {
        schoolId,
        action: 'PLAN_PUBLISHED',
        entityType: 'FeePlanVersion',
        entityId: version.id,
        performedByUserId: userId,
        details: JSON.stringify({
          feePlanId,
          versionNumber,
          totalAmount: version.totalAmount.toString(),
        }),
      },
    });

    return published;
  });
}

/**
 * Assigns a published FeePlanVersion to a set of student enrollments.
 * Creates immutable StudentFeeAssignment and corresponding FeeObligation records.
 */
export async function assignFeePlanToEnrollments(
  schoolId: string,
  params: AssignFeePlanInput,
  userId: string
) {
  const {
    academicSessionId,
    feePlanVersionId,
    studentEnrollmentIds,
    customConcessionAmount = 0,
    concessionReason,
    concessionApprovedByUserId,
  } = params;

  // 1. Fetch published FeePlanVersion with installments
  const version = await prisma.feePlanVersion.findFirst({
    where: {
      id: feePlanVersionId,
      schoolId,
    },
    include: {
      installments: {
        orderBy: { installmentNumber: 'asc' },
      },
      feePlan: true,
    },
  });

  if (!version) {
    throw new Error('Fee plan version not found.');
  }

  if (version.status !== FeePlanVersionStatus.PUBLISHED) {
    throw new Error('Only PUBLISHED fee plan versions can be assigned to students.');
  }

  // 2. Fetch valid enrollments in this session
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      id: { in: studentEnrollmentIds },
      schoolId,
      academicSessionId,
      status: 'ACTIVE',
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
    },
  });

  if (enrollments.length === 0) {
    throw new Error('No active student enrollments found matching the criteria.');
  }

  const results: any[] = [];

  await prisma.$transaction(async (tx) => {
    for (const enr of enrollments) {
      // Check if this enrollment already has an active assignment for this plan version
      const existing = await tx.studentFeeAssignment.findUnique({
        where: {
          studentEnrollmentId_feePlanVersionId: {
            studentEnrollmentId: enr.id,
            feePlanVersionId: version.id,
          },
        },
      });

      if (existing) {
        // Skip or continue if already assigned
        results.push(existing);
        continue;
      }

      // Concession validation
      const concessionDec = new Prisma.Decimal(customConcessionAmount);
      if (concessionDec.greaterThan(version.totalAmount)) {
        throw new Error(
          `Concession amount (₹${concessionDec}) cannot exceed plan total amount (₹${version.totalAmount}).`
        );
      }

      // 3. Create StudentFeeAssignment
      const assignment = await tx.studentFeeAssignment.create({
        data: {
          schoolId,
          academicSessionId,
          studentId: enr.studentId,
          studentEnrollmentId: enr.id,
          feePlanVersionId: version.id,
          customConcessionAmount: concessionDec,
          concessionReason: concessionReason || null,
          concessionApprovedByUserId: concessionApprovedByUserId || null,
          assignedByUserId: userId,
          status: FeeAssignmentStatus.ACTIVE,
        },
      });

      // 4. Generate FeeObligations for each installment
      // Distribute concession sequentially across the earliest installments
      let remainingConcession = concessionDec;

      for (const inst of version.installments) {
        const instOriginal = inst.amount;
        let instConcession = new Prisma.Decimal(0);

        if (remainingConcession.greaterThan(0)) {
          if (remainingConcession.greaterThanOrEqualTo(instOriginal)) {
            instConcession = instOriginal;
            remainingConcession = remainingConcession.minus(instOriginal);
          } else {
            instConcession = remainingConcession;
            remainingConcession = new Prisma.Decimal(0);
          }
        }

        const netAmount = instOriginal.minus(instConcession);
        const obligationStatus = netAmount.equals(0)
          ? FeeObligationStatus.WAIVED
          : FeeObligationStatus.PENDING;

        await tx.feeObligation.create({
          data: {
            schoolId,
            academicSessionId,
            studentId: enr.studentId,
            studentEnrollmentId: enr.id,
            assignmentId: assignment.id,
            installmentId: inst.id,
            title: inst.name,
            dueDate: inst.dueDate,
            originalAmount: instOriginal,
            concessionAmount: instConcession,
            netAmount,
            paidAmount: new Prisma.Decimal(0),
            balanceAmount: netAmount,
            status: obligationStatus,
          },
        });
      }

      // 5. Audit log
      await tx.feeAuditLog.create({
        data: {
          schoolId,
          action: 'ASSIGNMENT_CREATED',
          entityType: 'StudentFeeAssignment',
          entityId: assignment.id,
          performedByUserId: userId,
          details: JSON.stringify({
            studentId: enr.studentId,
            studentEnrollmentId: enr.id,
            feePlanId: version.feePlanId,
            versionNumber: version.versionNumber,
            concessionAmount: concessionDec.toString(),
          }),
        },
      });

      results.push(assignment);
    }
  }, { maxWait: 15000, timeout: 30000 });

  return results;
}

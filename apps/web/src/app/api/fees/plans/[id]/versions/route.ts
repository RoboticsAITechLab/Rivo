import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { FeePlanVersionStatus, Prisma } from '@prisma/client';
import { validatePlanSchedule } from '@/lib/fees/fee-plan-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.plan_create' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const body = await req.json();

    const plan = await prisma.feePlan.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            items: true,
            installments: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ message: 'Fee plan not found' }, { status: 404 });
    }

    const latestVersion = plan.versions[0];
    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Use items & installments from request or clone from previous version
    const items = body.items || latestVersion?.items.map((it) => ({
      feeHeadId: it.feeHeadId,
      name: it.name,
      amount: Number(it.amount),
      isOptional: it.isOptional,
      displayOrder: it.displayOrder,
    })) || [];

    const installments = body.installments || latestVersion?.installments.map((inst) => ({
      installmentNumber: inst.installmentNumber,
      name: inst.name,
      dueDate: inst.dueDate,
      amount: Number(inst.amount),
      lateFeeFinePerDay: inst.lateFeeFinePerDay ? Number(inst.lateFeeFinePerDay) : null,
      gracePeriodDays: inst.gracePeriodDays,
    })) || [];

    const totalAmount = Number(body.totalAmount ?? latestVersion?.totalAmount ?? 0);

    const scheduleValidation = validatePlanSchedule(
      totalAmount,
      items,
      installments
    );
    if (!scheduleValidation.isValid) {
      throw new Error(scheduleValidation.errors.join(' '));
    }

    const newVersion = await prisma.$transaction(async (tx) => {
      const v = await tx.feePlanVersion.create({
        data: {
          schoolId: auth.schoolId,
          feePlanId: plan.id,
          versionNumber: newVersionNumber,
          totalAmount: new Prisma.Decimal(totalAmount),
          currency: body.currency || latestVersion?.currency || 'INR',
          status: FeePlanVersionStatus.DRAFT,
          items: {
            create: items.map((it: any, idx: number) => ({
              feeHeadId: it.feeHeadId,
              name: it.name,
              amount: new Prisma.Decimal(it.amount),
              isOptional: it.isOptional ?? false,
              displayOrder: it.displayOrder ?? idx,
            })),
          },
          installments: {
            create: installments.map((inst: any) => ({
              installmentNumber: inst.installmentNumber,
              name: inst.name,
              dueDate: new Date(inst.dueDate),
              amount: new Prisma.Decimal(inst.amount),
              lateFeeFinePerDay: inst.lateFeeFinePerDay ? new Prisma.Decimal(inst.lateFeeFinePerDay) : null,
              gracePeriodDays: inst.gracePeriodDays ?? 0,
            })),
          },
        },
        include: {
          items: { include: { feeHead: true } },
          installments: true,
        },
      });

      // Update currentVersion pointer on FeePlan
      await tx.feePlan.update({
        where: { id: plan.id },
        data: { currentVersion: newVersionNumber },
      });

      await tx.feeAuditLog.create({
        data: {
          schoolId: auth.schoolId,
          action: 'PLAN_CREATED',
          entityType: 'FeePlanVersion',
          entityId: v.id,
          performedByUserId: auth.session.userId,
          details: JSON.stringify({
            feePlanId: plan.id,
            versionNumber: newVersionNumber,
            totalAmount,
          }),
        },
      });

      return v;
    });

    return NextResponse.json({
      message: `Created new version v${newVersionNumber} (Draft)`,
      version: newVersion,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/fees/plans/[id]/versions:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create fee plan version' },
      { status: 400 }
    );
  }
}

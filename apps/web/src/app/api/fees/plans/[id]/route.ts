import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { FeePlanVersionStatus, Prisma } from '@prisma/client';
import { validatePlanSchedule } from '@/lib/fees/fee-plan-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;

    const plan = await prisma.feePlan.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            publishedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
            items: {
              include: { feeHead: true },
              orderBy: { displayOrder: 'asc' },
            },
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
            assignments: {
              take: 20,
              include: {
                student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
                studentEnrollment: {
                  select: {
                    rollNumber: true,
                    class: { select: { name: true } },
                    section: { select: { name: true } },
                  },
                },
              },
            },
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ message: 'Fee plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error in GET /api/fees/plans/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ message: 'Fee plan not found' }, { status: 404 });
    }

    const latestVersion = plan.versions[0];
    if (!latestVersion) {
      return NextResponse.json({ message: 'No versions found for fee plan' }, { status: 400 });
    }

    // IMMUTABILITY: Published versions cannot be mutated
    if (latestVersion.status === FeePlanVersionStatus.PUBLISHED) {
      return NextResponse.json(
        { message: 'Published fee plan versions are immutable. Create a new draft version instead.' },
        { status: 403 }
      );
    }

    // Update metadata on FeePlan
    await prisma.feePlan.update({
      where: { id: plan.id },
      data: {
        name: body.name ?? plan.name,
        description: body.description !== undefined ? body.description : plan.description,
        campusId: body.campusId !== undefined ? body.campusId : plan.campusId,
        sectionId: body.sectionId !== undefined ? body.sectionId : plan.sectionId,
        streamId: body.streamId !== undefined ? body.streamId : plan.streamId,
      },
    });

    // If items or installments are provided, validate schedule and replace them
    if (body.items && body.installments) {
      const totalAmount = Number(body.totalAmount ?? latestVersion.totalAmount);
      const scheduleValidation = validatePlanSchedule(
        totalAmount,
        body.items,
        body.installments
      );
      if (!scheduleValidation.isValid) {
        throw new Error(scheduleValidation.errors.join(' '));
      }

      await prisma.$transaction(async (tx) => {
        // Update version total
        await tx.feePlanVersion.update({
          where: { id: latestVersion.id },
          data: {
            totalAmount: new Prisma.Decimal(totalAmount),
          },
        });

        // Delete old items and installments
        await tx.feePlanItem.deleteMany({ where: { feePlanVersionId: latestVersion.id } });
        await tx.feeInstallment.deleteMany({ where: { feePlanVersionId: latestVersion.id } });

        // Insert new items
        await tx.feePlanItem.createMany({
          data: body.items.map((item: any, idx: number) => ({
            feePlanVersionId: latestVersion.id,
            feeHeadId: item.feeHeadId,
            name: item.name,
            amount: new Prisma.Decimal(item.amount),
            isOptional: item.isOptional ?? false,
            displayOrder: item.displayOrder ?? idx,
          })),
        });

        // Insert new installments
        await tx.feeInstallment.createMany({
          data: body.installments.map((inst: any) => ({
            feePlanVersionId: latestVersion.id,
            installmentNumber: inst.installmentNumber,
            name: inst.name,
            dueDate: new Date(inst.dueDate),
            amount: new Prisma.Decimal(inst.amount),
            lateFeeFinePerDay: inst.lateFeeFinePerDay ? new Prisma.Decimal(inst.lateFeeFinePerDay) : null,
            gracePeriodDays: inst.gracePeriodDays ?? 0,
          })),
        });
      });
    }

    const updated = await prisma.feePlan.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        class: true,
        section: true,
        campus: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            items: { include: { feeHead: true } },
            installments: { orderBy: { installmentNumber: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error: any) {
    console.error('Error in PATCH /api/fees/plans/[id]:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update fee plan' },
      { status: 400 }
    );
  }
}

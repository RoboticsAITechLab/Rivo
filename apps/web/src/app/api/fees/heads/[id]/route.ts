import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// PATCH /api/fees/heads/[id] - Update fee head metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.plan_create' });
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.feeHead.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Fee head not found.' }, { status: 404 });
    }

    const name = body.name ? body.name.trim() : existing.name;
    const code = body.code ? body.code.trim().toUpperCase() : existing.code;
    const description = body.description !== undefined ? body.description?.trim() : existing.description;
    const isRefundable = body.isRefundable !== undefined ? Boolean(body.isRefundable) : existing.isRefundable;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive;

    // If code or name changed, check uniqueness
    if (code !== existing.code || name !== existing.name) {
      const duplicate = await prisma.feeHead.findFirst({
        where: {
          schoolId: auth.schoolId,
          id: { not: existing.id },
          OR: [{ code }, { name }],
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { message: `Fee head with code '${code}' or name '${name}' already exists.` },
          { status: 409 }
        );
      }
    }

    // If used in fee plans, disallow changing code to preserve historical audit integrity
    if (existing._count.items > 0 && code !== existing.code) {
      return NextResponse.json(
        {
          message: `Cannot change code of Fee Head '${existing.name}' because it is linked to ${existing._count.items} fee plan version(s).`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.feeHead.update({
      where: { id: existing.id },
      data: {
        name,
        code,
        description,
        isRefundable,
        isActive,
      },
    });

    // Record audit log
    await prisma.feeAuditLog.create({
      data: {
        schoolId: auth.schoolId,
        action: 'PLAN_UPDATED',
        entityType: 'FeeHead',
        entityId: updated.id,
        performedByUserId: auth.session.userId,
        details: JSON.stringify({
          action: 'FEE_HEAD_UPDATED',
          before: { name: existing.name, code: existing.code },
          after: { name: updated.name, code: updated.code },
        }),
      },
    });

    return NextResponse.json({ head: updated });
  } catch (error: any) {
    console.error('Error in PATCH /api/fees/heads/[id]:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/fees/heads/[id] - Safe delete fee head if unused
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.plan_create' });
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const existing = await prisma.feeHead.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Fee head not found.' }, { status: 404 });
    }

    if (existing._count.items > 0) {
      return NextResponse.json(
        {
          message: `Fee Head '${existing.name}' is currently utilized in ${existing._count.items} fee plan version(s) and cannot be deleted. Deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.feeHead.delete({
      where: { id: existing.id },
    });

    await prisma.feeAuditLog.create({
      data: {
        schoolId: auth.schoolId,
        action: 'PLAN_UPDATED',
        entityType: 'FeeHead',
        entityId: existing.id,
        performedByUserId: auth.session.userId,
        details: JSON.stringify({ action: 'FEE_HEAD_DELETED', code: existing.code, name: existing.name }),
      },
    });

    return NextResponse.json({ message: 'Fee head deleted successfully.' });
  } catch (error: any) {
    console.error('Error in DELETE /api/fees/heads/[id]:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

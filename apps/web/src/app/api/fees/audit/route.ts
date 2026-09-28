import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { FeeAuditAction } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') as FeeAuditAction | null;
    const entityType = searchParams.get('entityType')?.trim();
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    const where: any = {
      schoolId: auth.schoolId,
    };

    if (action && Object.values(FeeAuditAction).includes(action)) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (search) {
      where.OR = [
        { details: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { performedByUser: { firstName: { contains: search, mode: 'insensitive' } } },
        { performedByUser: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.feeAuditLog.findMany({
        where,
        include: {
          performedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.feeAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/fees/audit:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

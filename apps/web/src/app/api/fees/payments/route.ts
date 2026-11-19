import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { recordFeePayment } from '@/lib/fees/fee-payment-service';
import { getRedisClient, isRedisHealthy } from '@/lib/redis/client';
import { RedisKeys } from '@/lib/redis/keys';

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 Hours
const inMemoryIdempotencyCache = new Map<string, { payload: any; status: number; expiresAt: number }>();

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const academicSessionId = searchParams.get('academicSessionId');

    const payments = await prisma.feePayment.findMany({
      where: {
        schoolId: auth.schoolId,
        ...(studentId ? { studentId } : {}),
        ...(academicSessionId ? { academicSessionId } : {}),
      },
      include: {
        receipt: true,
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        allocations: {
          include: { obligation: { select: { id: true, title: true, dueDate: true } } },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error in GET /api/fees/payments:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.payment_record' });
    if (!auth.authorized) return auth.response;

    const rawIdempotencyKey = req.headers.get('x-idempotency-key') || req.headers.get('idempotency-key');
    const idempotencyKey = rawIdempotencyKey?.trim() || null;
    let redisKey: string | null = null;

    if (idempotencyKey) {
      redisKey = RedisKeys.feePaymentIdempotency(auth.schoolId, idempotencyKey);
      const redis = getRedisClient();

      if (redis && isRedisHealthy()) {
        try {
          const cached = await redis.get(redisKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            return NextResponse.json(parsed, {
              status: 200,
              headers: {
                'x-idempotent-replayed': 'true',
                'x-idempotency-key': idempotencyKey,
              },
            });
          }
        } catch (cacheErr) {
          console.warn('[IDEMPOTENCY_REDIS_ERROR] Could not read from Redis cache:', cacheErr);
        }
      }

      // In-memory fallback check
      const memCached = inMemoryIdempotencyCache.get(redisKey);
      if (memCached && memCached.expiresAt > Date.now()) {
        return NextResponse.json(memCached.payload, {
          status: memCached.status,
          headers: {
            'x-idempotent-replayed': 'true',
            'x-idempotency-key': idempotencyKey,
          },
        });
      }
    }

    const body = await req.json();

    if (!body.academicSessionId || !body.studentId || !body.studentEnrollmentId || !body.amount || !body.paymentMode) {
      return NextResponse.json(
        { message: 'academicSessionId, studentId, studentEnrollmentId, amount, and paymentMode are required.' },
        { status: 400 }
      );
    }

    const result = await recordFeePayment(
      auth.schoolId,
      {
        academicSessionId: body.academicSessionId,
        studentId: body.studentId,
        studentEnrollmentId: body.studentEnrollmentId,
        amount: Number(body.amount),
        paymentMode: body.paymentMode,
        paymentDate: body.paymentDate,
        referenceNumber: body.referenceNumber,
        bankName: body.bankName,
        chequeDate: body.chequeDate,
        remarks: body.remarks,
        allocations: body.allocations,
      },
      auth.session.userId
    );

    // Cache successful response for 24 hours under the idempotency key
    if (idempotencyKey && redisKey) {
      const redis = getRedisClient();
      if (redis && isRedisHealthy()) {
        try {
          await redis.set(redisKey, JSON.stringify(result), 'EX', IDEMPOTENCY_TTL_SECONDS);
        } catch (cacheSetErr) {
          console.warn('[IDEMPOTENCY_REDIS_ERROR] Could not set Redis key:', cacheSetErr);
        }
      }

      inMemoryIdempotencyCache.set(redisKey, {
        payload: result,
        status: 201,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_SECONDS * 1000,
      });
    }

    return NextResponse.json(result, {
      status: 201,
      headers: idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {},
    });
  } catch (error: any) {
    console.error('Error in POST /api/fees/payments:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to record fee payment' },
      { status: 400 }
    );
  }
}

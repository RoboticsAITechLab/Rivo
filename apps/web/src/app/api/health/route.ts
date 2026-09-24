import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRedisHealth } from '@/lib/redis/health';
import { getResendClient } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus: 'connected' | 'unhealthy' = 'unhealthy';
  let dbLatencyMs: number | undefined;

  // 1. Check PostgreSQL
  const dbStart = Date.now();
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbError = err?.message || String(err);
    dbStatus = 'unhealthy';
  }

  // 2. Check Redis
  const redisHealth = await checkRedisHealth();

  // 3. Check Email Provider configuration
  const emailClient = getResendClient();
  const emailStatus = emailClient ? 'configured' : 'mock/local';

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          error: dbError,
        },
        redis: {
          status: redisHealth.status,
          latencyMs: redisHealth.latencyMs,
        },
        email: {
          status: emailStatus,
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}

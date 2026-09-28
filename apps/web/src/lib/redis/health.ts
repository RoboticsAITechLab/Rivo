import { getRedisClient } from './client';

export interface RedisHealthStatus {
  status: 'connected' | 'unavailable' | 'disabled';
  latencyMs?: number;
}

export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  const redis = getRedisClient();
  if (!redis) {
    return { status: 'disabled' };
  }

  const start = Date.now();
  try {
    const result = await Promise.race([
      redis.ping(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
      ),
    ]);
    const latencyMs = Date.now() - start;
    if (result === 'PONG') {
      return { status: 'connected', latencyMs };
    }
    return { status: 'unavailable' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[REDIS_HEALTH_ERROR]:', msg);
    return { status: 'unavailable' };
  }
}

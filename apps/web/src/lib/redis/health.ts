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
    const result = await redis.ping();
    const latencyMs = Date.now() - start;
    if (result === 'PONG') {
      return { status: 'connected', latencyMs };
    }
    return { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}

import { getRedisClient, isProductionMode } from '@/lib/redis/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface InMemoryRecord {
  count: number;
  resetAt: number;
}

const LUA_RATE_LIMIT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`;

export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private static readonly inMemoryStorage = new Map<string, InMemoryRecord>();

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Consumes a request against the rate limiter.
   * If Redis is available, executes an atomic increment with TTL.
   * If in production and Redis is unreachable, fails closed for security.
   * In local development, falls back to in-memory sliding window.
   */
  public async consume(key: string): Promise<RateLimitResult> {
    const redis = getRedisClient();

    if (redis) {
      try {
        const formattedKey = key.startsWith('rivo:rl:') ? key : `rivo:rl:${key}`;
        const result = (await redis.eval(
          LUA_RATE_LIMIT,
          1,
          formattedKey,
          this.windowMs.toString()
        )) as [number, number];

        const [count, ttlMs] = result;
        const ttl = ttlMs > 0 ? ttlMs : this.windowMs;
        const now = Date.now();
        const resetAt = now + ttl;

        if (count > this.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetAt,
          };
        }

        return {
          allowed: true,
          remaining: Math.max(0, this.maxRequests - count),
          resetAt,
        };
      } catch (redisError) {
        console.error('[REDIS_RATE_LIMIT_ERROR] Failed Redis rate limit check:', redisError);
        if (isProductionMode()) {
          // Fail-closed policy in production: do not allow requests if rate limiter fails
          console.warn('[REDIS_SECURITY] Fail-closed rate limit applied in production');
          return {
            allowed: false,
            remaining: 0,
            resetAt: Date.now() + this.windowMs,
          };
        }
        // In local mode, fall through to in-memory limiter
      }
    } else if (isProductionMode()) {
      // Production without Redis must fail closed
      console.warn('[REDIS_SECURITY] Production Redis is required but missing. Failing closed.');
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + this.windowMs,
      };
    }

    // Local / In-memory fallback
    return this.consumeInMemory(key);
  }

  /**
   * Synchronous in-memory consumption for testing and local environments
   */
  public consumeInMemory(key: string): RateLimitResult {
    const now = Date.now();
    let record = RateLimiter.inMemoryStorage.get(key);

    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      RateLimiter.inMemoryStorage.set(key, record);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: record.resetAt,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  public async reset(key: string): Promise<void> {
    RateLimiter.inMemoryStorage.delete(key);
    const redis = getRedisClient();
    if (redis) {
      try {
        const formattedKey = key.startsWith('rivo:rl:') ? key : `rivo:rl:${key}`;
        await redis.del(formattedKey);
      } catch {
        // Ignore redis delete error during reset
      }
    }
  }

  public purgeExpired(): void {
    const now = Date.now();
    for (const [key, record] of RateLimiter.inMemoryStorage.entries()) {
      if (record.resetAt <= now) {
        RateLimiter.inMemoryStorage.delete(key);
      }
    }
  }
}

// 5 attempts per 15 minutes for login
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

// 3 attempts per hour for password recovery requests
export const forgotPasswordRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
});

// 5 attempts per 15 minutes for password resets
export const resetPasswordRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

// 20 invitations per hour per user/school
export const invitationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
});

// 5 MFA attempts per 15 minutes
export const mfaRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

/**
 * Generic rate limit checker for testing and flexible endpoints
 */
export async function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowSecs = 60,
  failClosed = false
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
  if (failClosed) {
    const redis = getRedisClient();
    if (!redis) {
      return { allowed: false, remaining: 0, resetInMs: windowSecs * 1000 };
    }
  }

  const limiter = new RateLimiter({
    windowMs: windowSecs * 1000,
    maxRequests,
  });

  const res = await limiter.consume(key);
  return {
    allowed: res.allowed,
    remaining: res.remaining,
    resetInMs: Math.max(0, res.resetAt - Date.now()),
  };
}

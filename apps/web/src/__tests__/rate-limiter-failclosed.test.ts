import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RateLimiter } from '@/lib/auth/rate-limiter';

describe('RIVO-SEC-004: Production Redis Rate Limiter Fail-Closed & Dev Fallback', () => {
  it('Production Mode: RateLimiter must FAIL CLOSED when Redis is unavailable', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAuthMode = process.env.AUTH_INFRA_MODE;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH_INFRA_MODE;

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        prefix: 'test_prod_failclosed',
      });

      // Since Redis is not running in this test environment, consume() must fail closed
      const result = await limiter.consume('user-target-id-123');

      assert.strictEqual(
        result.allowed,
        false,
        'CRITICAL: Production rate limiter must reject requests (fail-closed) when Redis is unreachable.'
      );
      assert.strictEqual(
        result.remaining,
        0,
        'Remaining tokens must be 0 on fail-closed rejection.'
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalAuthMode !== undefined) {
        process.env.AUTH_INFRA_MODE = originalAuthMode;
      }
    }
  });

  it('Development Mode: RateLimiter must gracefully fall back to in-memory sliding window when Redis is unavailable', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAuthMode = process.env.AUTH_INFRA_MODE;

    try {
      process.env.NODE_ENV = 'development';
      delete process.env.AUTH_INFRA_MODE;

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 3,
        prefix: 'test_dev_fallback',
      });

      // 1st request should be allowed with 2 remaining
      const r1 = await limiter.consume('dev-user-abc');
      assert.strictEqual(r1.allowed, true, 'Dev mode 1st request must be allowed via in-memory fallback.');
      assert.strictEqual(r1.remaining, 2, 'Dev mode 1st request should have 2 remaining.');

      // 2nd request
      const r2 = await limiter.consume('dev-user-abc');
      assert.strictEqual(r2.allowed, true, 'Dev mode 2nd request must be allowed.');
      assert.strictEqual(r2.remaining, 1, 'Dev mode 2nd request should have 1 remaining.');

      // 3rd request
      const r3 = await limiter.consume('dev-user-abc');
      assert.strictEqual(r3.allowed, true, 'Dev mode 3rd request must be allowed.');
      assert.strictEqual(r3.remaining, 0, 'Dev mode 3rd request should have 0 remaining.');

      // 4th request should exceed limit and be rejected
      const r4 = await limiter.consume('dev-user-abc');
      assert.strictEqual(r4.allowed, false, 'Dev mode 4th request must be rejected when limit is exceeded.');
      assert.strictEqual(r4.remaining, 0);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalAuthMode !== undefined) {
        process.env.AUTH_INFRA_MODE = originalAuthMode;
      }
    }
  });
});

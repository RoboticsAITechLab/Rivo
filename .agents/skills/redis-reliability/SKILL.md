---
name: redis-reliability
description: Upstash Redis connection resilience, rate limiter fail-closed policies, session cache invalidation, and TLS security
version: 1.0.0
technologies:
  - Upstash Redis
  - ioredis 6.x
  - TLS rediss://
sources:
  - https://upstash.com/docs/redis/overall/getstarted
  - https://github.com/redis/ioredis
verification_date: 2026-11-11
---

# Redis Reliability & Caching Engineering Skill

## 1. Purpose & Scope
Operational best practices for Redis caching, distributed session state, sliding-window rate limiters, and handling Redis outages without catastrophic application downtime or security holes.

## 2. Core Engineering Principles
1. **Always Use Encrypted TLS Connections**: Connection strings must use the `rediss://` protocol (with double 's') to encrypt data in transit between serverless functions and Upstash.
2. **Explicit Connection Timeouts**: In serverless lambdas, a hung Redis connection can hold the execution thread until the lambda times out (15-60s). Configure strict timeouts:
   ```typescript
   connectTimeout: 3000,
   commandTimeout: 2000,
   maxRetriesPerRequest: 2
   ```
3. **Resilient Rate Limiter Fail Policy**:
   - For public informational endpoints: Fallback to an in-memory token bucket or log and permit.
   - For authentication endpoints (`/api/auth/login`, `/api/auth/parent/otp`): Implement a local in-memory sliding window or **fail closed** if the attack surface is active, preventing credential brute-forcing during outages.
4. **Deterministic Cache Expiry (TTL)**: Never store keys without an explicit TTL. Session keys should expire matching the session cookie TTL (e.g. 7 days or 30 days). Rate limit keys should expire after their window (e.g. 60s or 900s).
5. **Key Namespacing**: Always prefix keys with product and tenant namespace: `rivo:session:{tokenHash}`, `rivo:school:{schoolId}:cache:{key}`.

## 3. Recommended Implementation Patterns

### Resilient ioredis Client Configuration
```typescript
import Redis from 'ioredis';

export function createRedisClient(): Redis {
  return new Redis(process.env.REDIS_URL!, {
    connectTimeout: 3000,
    commandTimeout: 2000,
    maxRetriesPerRequest: 2,
    enableAutoPipelining: true,
    lazyConnect: true,
    tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 100, 1000);
    },
  });
}
```

## 4. Production Readiness Checklist
- [ ] TLS (`rediss://`) enforced on production Redis URLs.
- [ ] Explicit timeouts set to prevent serverless function hangs.
- [ ] Rate limiter has a bounded in-memory fallback strategy during Redis outages.
- [ ] Every cached entry has an explicit TTL.


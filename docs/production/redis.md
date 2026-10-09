# Redis Production Architecture & Distributed Rate Limiting

## 1. Overview
Rivo utilizes **Upstash Redis** as its authoritative distributed state store for rate limiting across stateless serverless edge functions on Vercel.

Because serverless instances do not share Node.js process memory, Redis provides a centralized, millisecond-latency store that enforces request rate limits across all concurrent serverless instances.

---

## 2. Environment Variables

| Variable | Required in Production | Description | Format / Example |
| :--- | :--- | :--- | :--- |
| `REDIS_URL` | **YES** | Primary connection string for Upstash or managed Redis | `rediss://default:<token>@<host>.upstash.io:6379` |
| `UPSTASH_REDIS_URL` | Optional Alias | Supported fallback alias populated by Vercel Upstash integration | `rediss://default:<token>@<host>.upstash.io:6379` |
| `AUTH_INFRA_MODE` | Optional | Set to `"production"` to explicitly mandate production security policies | `"production"` |

---

## 3. Operational Roles of Redis

Rivo enforces distributed rate limits using atomic Redis Lua scripts (`INCR` with `PEXPIRE`):

1. **User Login Throttling (`loginRateLimiter`):**
   - **Limit:** 5 attempts per 15 minutes per IP + email key.
   - **Route:** `POST /api/auth/login`.
   - **Protection:** Prevents credential-stuffing and brute-force password guessing.
2. **Password Reset Throttling (`forgotPasswordRateLimiter` & `resetPasswordRateLimiter`):**
   - **Limit:** 3 password recovery requests per hour; 5 reset attempts per 15 minutes.
   - **Routes:** `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
3. **MFA Challenge Throttling (`mfaRateLimiter`):**
   - **Limit:** 5 TOTP verification attempts per 15 minutes.
   - **Route:** `POST /api/auth/mfa/challenge`.
4. **Staff Invitation Throttling (`invitationRateLimiter`):**
   - **Limit:** 20 invitations dispatched per hour per institution.
   - **Route:** `POST /api/invitations`.

---

## 4. Security Policies & Failure Modes

### 4.1 Production Mode (Fail-Closed Policy)
In production (`NODE_ENV=production` or `AUTH_INFRA_MODE=production`):
- **Missing `REDIS_URL`:** Rate limiter immediately denies the request with HTTP 429 (`allowed: false`).
- **Redis Connection Error / Provider Outage:** When Redis times out or disconnects, the rate limiter **strictly fails closed**.
- **No Unsafe Memory Fallback:** Process-local memory fallback is strictly blocked in production mode to ensure outages do not open endpoints to attack.

### 4.2 Local Development Mode (Graceful Fallback)
In local development (`NODE_ENV !== production` and `AUTH_INFRA_MODE !== production`):
- If `REDIS_URL` is empty, unset, or set to placeholder (`redis://localhost:6379/placeholder`), the system falls back to an in-memory sliding window bucket.
- This allows offline local development without requiring a local Redis server daemon.

---

## 5. Connection Configuration & Serverless Optimization

The Redis client singleton (`apps/web/src/lib/redis/client.ts`) includes the following production settings:

```typescript
{
  maxRetriesPerRequest: 2,
  connectTimeout: 5000,
  // Serverless optimization: fail fast rather than queueing in memory
  enableOfflineQueue: false,
  lazyConnect: false,
}
```

- **Enforced TLS (`rediss://`):** Any connection URL targeting `*.upstash.io` automatically upgrades from `redis://` to `rediss://` for encrypted transit.
- **`enableOfflineQueue: false`:** In serverless functions, requests that cannot connect to Redis immediately fail rather than buffering and waiting until the Vercel function execution timeout (10-15s).
- **Sanitized Logging:** All connection error messages sanitize credentials and tokens, preventing sensitive connection strings from appearing in serverless runtime logs.

---

## 6. Health Verification

To verify Redis connectivity in production:

1. **Health Check Endpoint:**
   ```bash
   curl https://your-domain.rivo.edu/api/health
   ```
2. **Expected Response:**
   ```json
   {
     "status": "healthy",
     "services": {
       "database": { "status": "connected" },
       "redis": { "status": "connected", "latencyMs": 14 },
       "storage": { "status": "connected" }
     }
   }
   ```
3. If Redis is unreachable, `"status": "unavailable"` is returned, allowing external uptime monitoring systems (Datadog, Better Uptime) to immediately alert operations.

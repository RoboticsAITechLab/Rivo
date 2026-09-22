# Redis Integration & Distributed Rate Limiting

Rivo incorporates Redis for distributed state management across stateless serverless instances.

## Operational Roles of Redis

1. **Distributed Rate Limiting:**
   - Enforces login brute-force thresholds (5 attempts / 15 mins).
   - Enforces password reset rate limits (3 attempts / hour).
   - Enforces MFA verification limits (5 attempts / 15 mins).
   - Enforces staff invitation quotas (20 invites / hour).
   - Uses atomic Lua scripts (`EVAL`) with millisecond-precision sliding window TTLs.
2. **Session Revocation Blacklist:**
   - Provides high-speed validation for revoked tokens during `logout` and `logout-all` events.
3. **Read-Through Session Cache:**
   - Ephemeral cache layer to accelerate repeat API requests while PostgreSQL remains the authoritative source of truth.

## Dual Mode Behavior (`AUTH_INFRA_MODE`)

### 1. Local Mode (`AUTH_INFRA_MODE="local"`)
- Designed for local development where a Redis instance may not be running.
- If `REDIS_URL` is empty or unreachable, the rate limiter **falls back gracefully to an in-memory token bucket**.
- Developers can test the full application locally without installing or running a Redis daemon.

### 2. Production Mode (`AUTH_INFRA_MODE="production"`)
- Designed for the live production environment on Vercel.
- **Fail-Closed Security Policy:** If Redis is offline, unreachable, or `REDIS_URL` is missing, the rate limiter **FAILS CLOSED** and denies incoming authentication/verification requests with HTTP 429.
- This guarantees that a Redis outage can never silently leave authentication routes open to credential stuffing or brute-force attacks.

## Recommended Production Provider

- **Upstash Redis (Serverless):**
  - Native serverless compatibility with REST and standard Redis protocol.
  - Zero idle connection costs and automatic horizontal scaling.
  - Global replication options matching Vercel edge deployment zones.

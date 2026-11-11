---
name: sre-observability
description: Site Reliability Engineering, structured JSON logging, distributed tracing, health checks, SLI/SLO metrics, and incident alerting
version: 1.0.0
technologies:
  - SRE Principles & Google SRE Handbook
  - Structured Logging & OpenTelemetry
  - Health Checks & Error Tracking
sources:
  - https://sre.google/sre-book/table-of-contents/
  - https://opentelemetry.io/docs/
verification_date: 2026-11-11
---

# SRE, Observability & Reliability Engineering Skill

## 1. Purpose & Scope
Designing production observability, structured telemetry, error tracking, health check endpoints, and incident recovery runbooks for a high-availability school management platform.

## 2. Core Engineering Principles
1. **Four Golden Signals**: Monitor Latency, Traffic (requests/sec), Errors (5xx error rate), and Saturation (database pool usage, Redis memory).
2. **Structured JSON Logging**: Never use unformatted `console.log("Error occurred", err)`. Emit structured JSON logs containing timestamp, log level, correlation ID (`x-request-id`), schoolId, route, and sanitized error message:
   ```json
   {
     "level": "error",
     "timestamp": "2026-11-11T20:15:00.000Z",
     "requestId": "req_abc123",
     "schoolId": "SCH-1",
     "route": "/api/fees/payments",
     "message": "Payment transaction failed: obligation locked",
     "statusCode": 500
   }
   ```
3. **No PII or Credentials in Logs**: Strictly filter passwords, session tokens, OTP secrets, credit card details, and student Aadhaar/KYC numbers from log payloads.
4. **Deep Health Check Endpoints**:
   - `/api/health`: Lightweight liveness check (HTTP 200).
   - `/api/health/ready`: Deep readiness probe checking active connectivity to PostgreSQL (via `SELECT 1`) and Redis (via `PING`). Used by monitoring services and deployment gates.
5. **Realistic SLIs and SLOs**:
   - **Availability SLO**: 99.9% uptime for core School Admin portals during school hours (07:00 - 18:00 local time).
   - **Latency SLO**: 95% of API requests responding under 350ms; 99% under 1000ms.
   - **Payment Integrity SLO**: 100% of collected fees allocated with matching receipt and audit record.

## 3. Recommended Implementation Patterns

### Deep Health Check Implementation
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  const checks: Record<string, 'ok' | 'failed'> = { db: 'failed', redis: 'failed' };
  let isHealthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch (e) {
    isHealthy = false;
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = 'ok';
  } catch (e) {
    isHealthy = false;
  }

  return NextResponse.json(
    { status: isHealthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: isHealthy ? 200 : 503 }
  );
}
```

## 4. Production Readiness Checklist
- [ ] Structured logging utility deployed across API routes.
- [ ] Health check endpoint (`/api/health/ready`) verifies DB and Redis connectivity.
- [ ] Log sanitization prevents leakage of passwords, tokens, or PII.
- [ ] Critical alert channels (Slack/Discord/Email) configured for 5xx error spikes.


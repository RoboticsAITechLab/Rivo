---
name: api-security
description: REST API endpoint security, payload validation, sliding-window rate limiting, and HTTP error sanitization
version: 1.0.0
technologies:
  - Next.js Route Handlers
  - Zod / Typebox Validation
  - Upstash Redis Rate Limiting
sources:
  - https://owasp.org/www-project-api-security/
  - https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
verification_date: 2026-11-11
---

# API Security & Request Validation Engineering Skill

## 1. Purpose & Scope
Standards for hardening public and authenticated API endpoints against credential stuffing, injection, schema tampering, denial-of-service, and verbose error leakage.

## 2. Core Engineering Principles
1. **Schema Validation on All Inbound Payloads**: Every API handler accepting JSON must parse and validate inputs against a strict schema before executing business logic. Strip unexpected fields to prevent mass-assignment vulnerabilities.
2. **Sliding-Window Rate Limiting with Fail-Closed Fallback**:
   - Protect authentication endpoints (`5 attempts / 15 minutes / IP`), SMS/OTP triggers (`3 attempts / 10 minutes / phone`), and public endpoints.
   - If Redis connection times out or fails, implement a localized in-memory fallback or fail closed for high-risk operations (e.g. login/OTP) to prevent brute-force attacks during Redis degradation.
3. **Information Disclosure Prevention in Error Envelopes**: Never return raw database error messages, stack traces, or SQL query fragments to the client. Map all internal errors to clean, localized domain error codes.
4. **Idempotency on State-Mutating Endpoints**: Financial transactions and fee payments should accept an optional `Idempotency-Key` header to safely handle client retries without double-charging.
5. **Proper HTTP Status Codes**: Return `201 Created` for new entities, `204 No Content` for deletions, `400 Bad Request` for schema errors, `401 Unauthorized` for missing/invalid tokens, `403 Forbidden` for tenant or role violations, and `404 Not Found` when scoped resource is missing.

## 3. Recommended Implementation Patterns

### Standardized Input Validation Wrapper
```typescript
import { z } from 'zod';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (req: Request): Promise<{ data: T } | { errorResponse: Response }> => {
    try {
      const raw = await req.json();
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return {
          errorResponse: Response.json(
            { success: false, code: 'VALIDATION_ERROR', errors: parsed.error.flatten() },
            { status: 400 }
          ),
        };
      }
      return { data: parsed.data };
    } catch {
      return {
        errorResponse: Response.json(
          { success: false, code: 'INVALID_JSON', message: 'Malformed JSON payload.' },
          { status: 400 }
        ),
      };
    }
  };
}
```

## 4. Production Readiness Checklist
- [ ] Inbound validation on all `/api/*` endpoints.
- [ ] No stack traces or Prisma internals exposed in production API responses.
- [ ] Sliding-window rate limiters active on OTP, login, and public media routes.
- [ ] HTTP response headers include `Cache-Control: no-store` on private data.


# RIVO — Module 02: Authentication, Security & MFA

> **Document:** `MODULE_02_AUTH_SECURITY_MFA.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Security Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver enterprise-grade authentication, multi-tenant session management, Scrypt password hashing, TOTP-based Multi-Factor Authentication (MFA), fail-closed sliding-window rate limiting, and zero credential leaks.

---

## 2. Existing Implementation Status
- Scrypt password hashing and verification in `apps/web/src/lib/auth/crypto.ts`.
- TOTP MFA generation and verification using `otpauth` and AES-256-GCM encryption.
- Multi-role cookie authentication in `apps/web/src/lib/auth/authorize.ts`.
- Active critical flaw: Database password committed in `.env.example` (SEC-01).
- Active flaw: Rate limiter falls back to per-instance memory, failing open in production (SEC-06).

---

## 3. Required Final Functionality
- Zero plaintext credentials in `.env.example` or git history.
- Sliding-window rate limiters strictly fail closed when Redis is unavailable in production mode.
- 30-day sliding sessions stored in Upstash Redis (`rivo:session:tokenHash`) with instant global logout.
- Multi-factor authentication required for school directors and administrators.

---

## 4. Technical Requirements
- Node.js crypto Scrypt (`N=16384, r=8, p=1`, 64-byte key, 16-byte random salt).
- Upstash Redis with TLS (`rediss://`) via `ioredis 6.0.0`.
- Cookies: `HttpOnly; Secure; SameSite=Lax; Path=/`.

---

## 5. Frontend Tasks
- Verify login, MFA challenge prompt, and password recovery forms in `apps/web/src/app/(auth)/*`.
- Verify clear error messages on rate limit exhaustion (`HTTP 429 Too Many Requests`).

---

## 6. Backend Tasks
- `RIVO-SEC-001`: Sanitize `.env.example` templates and verify rotation of Neon DB password.
- `RIVO-SEC-004`: Update `apps/web/src/lib/auth/rate-limiter.ts` so `consume()` strictly returns `allowed: false` in production mode if Redis connection fails.

---

## 7. Database Tasks
- Verify `Session`, `UserMfa`, `MfaChallenge`, and `SecurityAuditLog` entities in `prisma/schema.prisma`.
- Ensure session revocation deletes corresponding `Session` rows and purges Redis cache keys.

---

## 8. API Requirements
- `POST /api/auth/login`: Email/password authentication, returning session cookie or MFA challenge token.
- `POST /api/auth/mfa/verify`: Validates 6-digit TOTP code, returns session cookie.
- `POST /api/auth/logout`: Revokes current session from database and Redis.

---

## 9. Security Requirements
- All token and password comparisons must use `crypto.timingSafeEqual`.
- Rate limits enforced: Login (5/15m), Password Reset (3/hr), MFA (5/15m).
- Passwords must enforce minimum 8 characters with uppercase, lowercase, number, and special character.

---

## 10. UI/UX Requirements
- Clean 6-digit OTP input boxes with auto-focus and clipboard paste support.
- Lockout timer display when rate limit is exceeded ("Please try again in 14 minutes").

---

## 11. Integration Dependencies
- Prerequisite for all authenticated routes in School Admin, Teacher, and Parent portals.

---

## 12. Error and Edge-Case Handling
- Malformed JWT/token fails closed and redirects user to login.
- Clock drift on TOTP handled via +/- 1 period window tolerance.

---

## 13. Testing Strategy
- `npm run test:auth`: 87-point RBAC and authentication matrix test.
- `npm run test:remediation`: Security fail-closed assertions across encryption and rate limiting.

---

## 14. Acceptance Criteria
- [ ] Group 3 of `test:remediation` passes (`RateLimiter in production mode strictly fails closed`).
- [ ] No plaintext database passwords in any repository file.
- [ ] Brute-force simulation triggers HTTP 429 after 5 failed attempts.

---

## 15. Deployment Considerations
- `MFA_ENCRYPTION_KEY` and `JWT_SECRET` must be set as 32+ byte cryptographically secure random values in Vercel.

---

## 16. Completion Checklist
- [ ] `RIVO-SEC-001` completed.
- [ ] `RIVO-SEC-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- If Redis fails, authentication routes fail closed, preventing new logins until Redis recovers (intentional security trade-off). Existing sessions with valid cookies remain cached.

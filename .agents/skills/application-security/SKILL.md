---
name: application-security
description: OWASP ASVS compliance, Scrypt KDF password hashing, secret lifecycle management, anti-XSS, CSRF protection, and secure cookies
version: 1.0.0
technologies:
  - OWASP Top 10 & ASVS 4.0
  - Scrypt KDF / Node.js Crypto
  - Next.js Security Headers
sources:
  - https://owasp.org/www-project-application-security-verification-standard/
  - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
verification_date: 2026-11-11
---

# Application Security Engineering Skill

## 1. Purpose & Scope
Rigorous application security standards based on OWASP ASVS Level 2 for SaaS applications handling sensitive personal, financial, and educational records.

## 2. Core Engineering Principles
1. **Never Commit Secrets to Git or Example Files**:
   - Real database URLs, API tokens, JWT secrets, or storage keys in `.env`, `.env.example`, or Git commit history represent a critical P0 compromise.
   - Example files must contain only dummy placeholders: `DATABASE_URL="postgresql://user:password@localhost:5432/dbname"`.
   - If secrets were ever committed to Git history, they must be revoked immediately, rotated at the provider, and purged via `git filter-repo` or BFG Repo-Cleaner.
2. **Cryptographic Password Hashing**:
   - Use Scrypt or Argon2id with memory-hard parameters: `N=16384, r=8, p=1` (or Scrypt `cost=16384, blockSize=8, parallelization=1`), generating a 64-byte key and a unique 16-byte cryptographically secure random salt per user.
   - Never use fast hash functions like SHA-256 or MD5 for passwords.
3. **Defense Against IDOR (Insecure Direct Object References)**:
   - Validate both tenant ownership (`schoolId`) and object relationship (e.g. parent-to-student relation in `StudentParentRel`, teacher-to-subject assignment in `TeacherSubjectAssignment`).
4. **Content Security Policy & Sanitization**:
   - Never render raw HTML with `dangerouslySetInnerHTML` unless sanitized through DOMPurify.
   - Serve strict security headers on all responses.
5. **Fail-Closed Security Architecture**:
   - If an authorization check, rate limiter, or session validation encounters an unexpected database or Redis error, the system must FAIL CLOSED (reject request with 500/403), never fail open.

## 3. Recommended Implementation Patterns

### Secure Password Verification (Scrypt)
```typescript
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  const [salt, key] = combinedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}
```

## 4. Production Readiness Checklist
- [ ] No actual passwords, tokens, or live URLs in any `.env.example` or repository files.
- [ ] Session cookies set with `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Rate limiting enforced on all authentication routes (`/api/auth/login`, `/api/auth/parent/otp`).
- [ ] Timing-safe comparison (`timingSafeEqual`) used for tokens and password checks.


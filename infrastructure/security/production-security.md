# Production Security Architecture & Standards

## Cryptographic Security Baseline

1. **Password Hashing:**
   - Implemented via Node.js native `crypto.scrypt`.
   - Uses a cryptographically secure 16-byte random salt per user.
   - Outputs a 64-byte key length with elevated work factor (`N=16384, r=8, p=1`).
2. **Session Token Security:**
   - Raw session tokens are 32-byte cryptographically random hex strings.
   - Tokens stored in the PostgreSQL database are hashed using SHA-256 before storage.
   - A database compromise never exposes actionable plaintext session credentials.
3. **MFA (TOTP) Secret Protection:**
   - TOTP secret keys are encrypted at rest in the `user_mfa` table using **AES-256-GCM**.
   - Encryption uses an ephemeral 12-byte Initialization Vector (IV) and a 16-byte authentication tag per secret.
   - Ciphertext format: `iv:authTag:encryptedSecret`.
   - Recovery backup codes are hashed using SHA-256 before storage; original plaintext codes are shown only once upon enrollment.
4. **Cookie Security:**
   - `httpOnly: true` (Prevents client-side XSS script reading).
   - `secure: true` in production (Transmitted strictly over HTTPS).
   - `sameSite: 'lax'` (Provides CSRF protection while permitting top-level navigation).

## Multi-Tenant Security & RBAC

- Multi-tenancy is enforced at the database query level. Every API route handler derives the tenant ID (`schoolId`) from the validated session cookie and membership check.
- Custom roles and permission overrides are evaluated hierarchically (`DENY` always overrides `ALLOW`).
- Strict resource scopes (`SCHOOL` vs `CAMPUS` vs `ASSIGNED`) restrict teachers and staff to authorized student rosters.

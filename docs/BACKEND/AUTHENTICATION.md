# Backend Authentication & Authorization Architecture

> **Last Verified:** November 11, 2026  
> **Source Target:** `apps/web/src/lib/auth`, `apps/web/src/lib/roles`, `apps/web/src/middleware.ts`

---

## 1. Authentication Lifecycle

### 1.1 Session Storage & Cryptographic Tokens
- **Cookie Name:** `rivo_session` (Flags: `HttpOnly: true`, `Secure: true` in production, `SameSite: 'lax'`, `Path: '/'`).
- **Token Generation:** 32 cryptographically random bytes generated via Node.js `crypto.randomBytes(32)` $\rightarrow$ `rawToken`.
- **Database Persistence:** The database **never stores raw tokens**. It stores only the SHA-256 hash (`tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')`) in the `Session` table.
- **Session Duration:** 7 days standard, or 30 days if `rememberMe: true` was requested during login.
- **Two-Tier Resolution:**
  1. **Tier 1 (Upstash Redis):** Key `rivo:session:<tokenHash>` stores cached `ActiveSessionContext` (TTL: 300 seconds / 5 minutes). Resolves in $< 15\text{ ms}$.
  2. **Tier 2 (PostgreSQL fallback):** Queries `prisma.session.findUnique({ where: { tokenHash }, include: { user: { include: { memberships, teachers } } } })`. On cache miss, writes back to Redis.

---

## 2. Password Hashing & MFA Mechanics

### 2.1 Password Hashing (`crypto.scrypt`)
- Utilizes native Node.js `crypto.scrypt` with a 16-byte cryptographically random salt and 64-byte key length.
- Stored format: `scrypt:<salt>:<derivedKeyHex>`.
- Timing-safe comparison using `crypto.timingSafeEqual`.

### 2.2 Multi-Factor Authentication (TOTP)
- **Engine:** `otpauth` package implementing RFC 6238 Time-Based One-Time Passwords (SHA-1, 6 digits, 30-second window, $\pm 1$ period tolerance).
- **Secret Encryption:** TOTP secrets are encrypted at rest in PostgreSQL (`user_mfa.totp_secret`) using AES-256-GCM authenticated encryption (`MFA_ENCRYPTION_KEY`).
- **Recovery Codes:** 10 single-use emergency backup codes generated at enrollment. The database stores only SHA-256 hashes of codes; when used, `usedAt` is set to prevent reuse.

---

## 3. Role & Permission Guard (`requireAuth`)

API route handlers protect their logic using the central guard in `apps/web/src/lib/auth/authorize.ts`:

```typescript
const auth = await requireAuth(req, {
  permission: 'fees.payment_record',
  scope: 'SCHOOL',
});
if (!auth.authorized) return auth.response;
```

### Deterministic 7-Stage Permission Precedence
1. **Active Check:** No valid session, revoked session, expired session, or inactive user/membership $\rightarrow$ **HTTP 401 DENY**.
2. **Director / Owner Override:** User holds `Role.DIRECTOR` or `Role.OWNER` $\rightarrow$ **ALLOW ALL** capabilities within the school tenant (`SCHOOL` scope).
3. **Principal / Admin Operational Authority:** User holds `Role.PRINCIPAL`, `Role.ADMIN`, or `Role.SCHOOL_ADMIN` $\rightarrow$ **ALLOW** on operational/academic modules, but **HTTP 403 DENY** on `roles.*` and `security.*` (reserved exclusively for Director/Owner).
4. **User Explicit Overrides:** Checks `UserPermissionOverride` table for explicit matches on `userId` and `permissionCode`:
   - `isGranted: false` $\rightarrow$ Explicit **DENY**.
   - `isGranted: true` $\rightarrow$ Explicit **ALLOW** with configured scope (`SCHOOL`, `CAMPUS`, `ASSIGNED`, `OWN`).
5. **Custom Role Permissions:** Evaluates permissions bound to tenant custom roles via the `RolePermission` junction table.
6. **Built-in System Role Defaults:** Evaluates standard role capabilities (e.g. `TEACHER` gets `ASSIGNED` scope on attendance/marks; `FEE_MANAGER` gets `SCHOOL` scope on fees/students).
7. **Default Fallback:** Otherwise $\rightarrow$ **HTTP 403 DENY**.

---

## 4. Resource Scoping Matrix

| Scope | Evaluation Target | Enforcement Behavior |
| :--- | :--- | :--- |
| `SCHOOL` | Entire School Tenant | Unrestricted access across all campuses, classes, and cohorts within `auth.schoolId`. |
| `CAMPUS` | Single Physical Campus | Filters queries by `teacher.campusId` or `campusId`. |
| `ASSIGNED` | Assigned Teaching Cohorts | Restricts queries to classes, sections, and subjects linked in `TeacherAssignment` records. |
| `OWN` | Personal Records | Restricts access to records where `userId == auth.userId` or `studentId == auth.studentId`. |


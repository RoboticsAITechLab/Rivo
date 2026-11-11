# RIVO — Security Architecture & Review

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Security Review  
> **Scope:** Authentication, Authorization, Encryption, Secrets, and Input Defense

---

## 1. Security Overview

Rivo's security architecture is engineered around the principle of **institutional zero trust**:
- **Authentication:** Dual-token model. Cryptographically random 32-byte session tokens issued in `HttpOnly`, `SameSite: 'lax'`, `Secure` cookies. Only SHA-256 hashes are persisted in PostgreSQL and cached in Redis.
- **Authorization:** Rigid application-level multi-tenancy (`schoolId`) enforced across all database queries, backed by a deterministic 7-stage permission hierarchy guard (`requireAuth`).
- **Data Protection:** Field-level AES-256-GCM authenticated encryption for sensitive KYC data (Aadhaar, PAN, Voter ID). Direct-to-cloud Azure SAS uploads with 15-minute write-only tokens and magic-byte signature validation.
- **Financial Auditability:** Immutable versioned fee plans, double-entry payment allocations, non-destructive transactional reversals, and tamper-evident sequential receipt numbering.

---

## 2. Security Documentation Map

- [SECURITY_REVIEW.md](file:///d:/Rivo/docs/SECURITY/SECURITY_REVIEW.md) — Exhaustive code-first security audit report containing all 12 prioritized vulnerability and risk findings (Critical, High, Medium, Low) and technical debt inventory.


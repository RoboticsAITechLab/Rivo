# Authentication Architecture

The Authentication settings (`/school/settings/security/authentication`) and gateway routes (`/login`, `/invite/accept`, `/verify-email`) govern user authentication protocols and access boundaries.

---

## 1. Authentication Mechanisms

Rivo implements standards-compliant identity verification:

1. **Email + Password**: Primary identity pair evaluated against cryptographically hashed secrets (e.g., Argon2id / bcrypt on backend API).
2. **Email Verification**: Mandatory verification step validating that users control their registered email before granting account access.
3. **Session Inactivity Timeout**: Automatically invalidates idle browser sessions after a configured duration (default: 30 minutes, range: 15-240 minutes).
4. **Role Access Gates**: Toggles allowing administrators to selectively disable web application logins for specific roles (e.g., disable student login during system maintenance).

---

## 2. Authentication Flow

```
[User Submits Credentials]
           │
           ▼
[Validate Input & Rate Limits]
           │
           ├─ Failure ──> [Increment Failed Attempt Counter & Show Error]
           │
           ▼ Success
[MFA Challenge Required?]
           │
     ┌─────┴─────┐
     ▼ Yes       ▼ No
[Verify TOTP]    │
     │           │
     └─────┬─────┘
           ▼
[Issue Secure Session Cookie (HttpOnly, SameSite=Strict)]
           │
           ▼
[Redirect to Scoped Dashboard (/school, /teacher, /student, /parent)]
```

---

## 3. Frontend / Backend Boundary

> [!NOTE]
> The Web Application manages client-side authentication states, route protection middleware (`middleware.ts`), login redirection, and token dispatch. Persistence, cookie issuance, and cryptographic hashing are executed by the centralized backend API.

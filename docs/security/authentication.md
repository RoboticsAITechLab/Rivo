# Authentication Architecture & Gateway Security

The Authentication system (`apps/web/src/lib/auth/`), gateway routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/invite/accept`), and route protection guards govern institutional security boundaries.

---

## 1. Authentication Lifecycle & States

The application models session lifecycle across five explicit states:

```
[Initial Mount] ──> [AUTHENTICATING]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 [AUTHENTICATED]                  [UNAUTHENTICATED]
        │                                 │
 [Role Check -> /school]          [Blocked -> /login]
```

| Auth State | Description | Routing Impact |
| :--- | :--- | :--- |
| `UNKNOWN` | Session status uninitialized. | Renders credentials loading indicator. |
| `AUTHENTICATING` | Actively communicating with backend verification endpoint. | Renders loading skeleton. |
| `AUTHENTICATED` | Valid session token active; `user` profile populated. | Grants access to scoped institutional workspace. |
| `UNAUTHENTICATED` | No active session or token invalidated. | Redirects `/school/*` routes to `/login?returnUrl=...`. |
| `ERROR` | Network or service error verifying session. | Renders error card with retry action. |

---

## 2. Protected Route Boundary (`AuthGuard`)

All `/school/*` routes are wrapped within `AuthGuard` in `src/app/(school)/school/layout.tsx`:

1. **Unauthenticated Check**: If state transitions to `UNAUTHENTICATED`, the user is immediately redirected to `/login` with `returnUrl` query parameter preserved.
2. **Role Authorization Check**: If authenticated, `user.roleType` is checked. Roles without school management access (e.g. `STUDENT`, `PARENT`) are redirected to `/access-denied`.
3. **Session Verification Skeleton**: While verifying session tokens on cold load, a clean institutional indicator prevents layout flickering.

---

## 3. Security Principles & Data Rules

- **Zero Mock Credentials**: No default admin accounts or fake login shortcuts exist in client runtime.
- **No Client Credential Storage**: Passwords and raw secret tokens are never stored in localStorage, sessionStorage, Zustand stores, or client logs.
- **Secure Cookie Integration**: Designed for HttpOnly, SameSite=Strict session cookie authentication with CORS credentials support (`credentials: 'include'`).
- **Account Enumeration Protection**: `/forgot-password` returns generic success feedback regardless of email registration status.

---

## 4. Frontend / Backend Integration Boundary

> [!IMPORTANT]
> **Integration Contract**:
> The Web Application provides full typed contracts in `IAuthService` and `AuthService` (`src/lib/auth/auth-service.ts`) targeting `/api/auth/login`, `/api/auth/signup/admin`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/forgot-password`, and `/api/auth/reset-password`.
> If backend services are not running or return network errors, the client gracefully surfaces connectivity alerts without faking successful authentication.

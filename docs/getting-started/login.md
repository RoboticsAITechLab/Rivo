# Authentication & Access Gateway

## 1. Overview

The Rivo authentication system provides a secure, role-aware gateway into the institutional environment. Authentication boundaries protect all internal `/school/*` routes against unauthorized access.

---

## 2. Authentication Routes

| Route | Purpose | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/login` | Primary sign-in | Public | Email and password credential validation. |
| `/forgot-password` | Self-service recovery | Public | Submits email to receive password reset tokens. |
| `/reset-password` | Password change | Public (Token-gated) | Validates one-time recovery token and updates credentials. |
| `/verify-email` | Email address verification | Public (Token-gated) | Confirms ownership of institutional email account. |
| `/invite/accept` | Staff onboarding | Public (Invite-gated) | Accepts administrative invitation, sets initial password. |
| `/access-denied` | Authorization boundary | Authenticated | Rendered when an authenticated user lacks required module permissions. |

---

## 3. Signing In (`/login`)

```
   ┌────────────────────────────────────────┐
   │                  RIVO                  │
   │   Institution Management & Access      │
   ├────────────────────────────────────────┤
   │  Sign in to your portal                │
   │                                        │
   │  Email Address                         │
   │  [ admin@school.edu                  ] │
   │                                        │
   │  Password                              │
   │  [ ••••••••••••••••••                ] │
   │                                        │
   │  [ Sign In to Portal ]                 │
   │                                        │
   │  [Forgot password?]                    │
   └────────────────────────────────────────┘
```

### Procedure
1. Navigate to `/login` in your modern browser.
2. Enter your authorized institutional **Email Address**.
3. Enter your **Password**.
4. Click **Sign In to Portal**.
5. Upon successful verification:
   - Administrators and Principals are routed to the **Executive Dashboard** (`/school`).
   - Teaching faculty are routed to their assigned classes and attendance registers.

> [!IMPORTANT]
> **Zero Mock Credentials**: Rivo does not include fake "demo one-click login" buttons or prefilled test accounts in production views. Users must authenticate with registered institutional credentials.

---

## 4. Password Recovery (`/forgot-password`)

If a user forgets their password:
1. Click **Forgot password?** on the login screen, or navigate directly to `/forgot-password`.
2. Provide the registered institutional email address.
3. Click **Send Recovery Instructions**.
4. The system validates whether an active account exists for the email and dispatches a time-limited reset link pointing to `/reset-password?token=...`.
5. The reset token expires after the duration configured in **Security Settings > Account Recovery** (default: 60 minutes).

---

## 5. Staff Invitation Acceptance (`/invite/accept`)

When a school administrator invites a new faculty member or administrative user via `/school/settings/invitations`:
1. The recipient receives an invitation link with a unique cryptographic token: `/invite/accept?token=...`.
2. The user arrives at the acceptance screen displaying:
   - Institutional Name & Campus.
   - Assigned Role (e.g. `Teacher`, `Department Head`).
   - Pre-filled verified email address.
3. The user inputs their desired password, adhering to the school's configured **Password Complexity Policy**.
4. Upon clicking **Activate Account**, the user's membership transitions from `PENDING` to `ACTIVE`, and they are immediately logged into the portal.

---

## 6. Access Control & Authorization Guard (`/access-denied`)

If an authenticated user attempts to access a route or perform an action beyond their permitted scope (for example, a Teacher attempting to visit `/school/settings/security/authentication`):
1. The routing boundary intercepts the request.
2. The user is redirected to `/access-denied`.
3. The page displays a security notice detailing:
   - The requested resource.
   - The user's current role and scope.
   - A button to return safely to their primary dashboard (`/school`).

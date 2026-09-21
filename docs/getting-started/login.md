# Authentication & Access Gateway

## 1. Overview

The Rivo authentication system provides a secure, role-aware gateway into the institutional environment. A dedicated two-column authentication layout hosts the sign-in and administrator onboarding experiences, completely isolated from internal application sidebars.

---

## 2. Authentication Routes

| Route | Purpose | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/login` | Primary sign-in | Public | Email and password credential validation with password visibility toggle. |
| `/signup` | School admin signup | Public | 4-step wizard to create the primary administrator account and register the school workspace. |
| `/forgot-password` | Self-service recovery | Public | Submits email to receive secure password reset tokens. |
| `/reset-password` | Password change | Public (Token-gated) | Validates one-time recovery token and updates credentials. |
| `/verify-email` | Email verification | Public (Token-gated) | Confirms ownership of institutional email account. |
| `/invite/accept` | Staff onboarding | Public (Invite-gated) | Accepts administrative invitation and sets credentials. |
| `/access-denied` | Authorization boundary | Authenticated | Rendered when an authenticated user lacks required module permissions. |

---

## 3. Signing In (`/login`)

```
┌──────────────────────────────────────────────┐
│                                              │
│                 RIVO                         │
│                                              │
│             Welcome back                     │
│      Sign in to your school account.         │
│                                              │
│ Email *                                      │
│ [____________________________________]       │
│                                              │
│ Password *                                   │
│ [______________________________] [◉]         │
│                                              │
│ [ ] Remember this device                     │
│                                              │
│ Forgot password?                             │
│                                              │
│             [ Sign In ]                      │
│                                              │
│ ─────────────── or ─────────────────         │
│                                              │
│ Don't have an account?                       │
│ Create school account →                      │
│                                              │
└──────────────────────────────────────────────┘
```

### Features & Validation
1. **Email & Password**: Both fields are required. Email is validated against standard RFC format.
2. **Password Visibility Toggle**: An accessible, keyboard-operable eye toggle reveals/masks the password (`aria-label="Show password"` / `"Hide password"`).
3. **Remember Device**: Checkbox toggling device persistence flag.
4. **Duplicate Submission Prevention**: The submit button disables and transitions to `Signing in...` while the request is in flight.
5. **Accessible Alerts**: Error states (invalid credentials, network failure, service unavailable) are announced in an accessible `role="alert"` container.
6. **Session-Aware Redirection**: Already authenticated users navigating to `/login` are automatically routed to their authorized workspace (`/school`) or `/access-denied`.

---

## 4. School Admin Signup (`/signup`)

Route `/signup` provides a structured, 4-step intake flow to establish a school organization:

```
Create your school account
 ① Admin ─── ② School ─── ③ Security ─── ④ Review
```

### Step 1: Administrator
- First Name *, Last Name *, Work Email *, Phone (Optional), Password *, Confirm Password *.
- Real-time password criteria evaluation:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Confirm Password match validation (`Passwords do not match.`).

### Step 2: School Information
- School Legal Name *.
- Optional fields: School Code, Affiliation/Board, Official Email, Phone, Address.
- **Multi-Campus Rule**: Campus creation is not forced during signup. Campus branches can be configured under School Settings after onboarding.

### Step 3: Security & Terms
- Institutional governance standards overview.
- Terms of Service and Privacy Policy agreement checkbox (required to proceed).

### Step 4: Review & Create
- Presents only entered values (zero mock data).
- Action: `Create School Account` -> `Creating account...`.
- Redirects to `/verify-email` if verification is required, or `/school` upon immediate session establishment.

---

## 5. Protected Route Enforcement (`/school/*`)

All internal school routes require active authentication:

```
HTTP Request to /school/*
          │
          ▼
   [Session Check]
          │
    ┌─────┴─────┐
    ▼ No        ▼ Yes
 Redirect     [Role Check]
 to /login         │
             ┌─────┴─────┐
             ▼ Denied    ▼ Allowed
          Redirect     Render Protected
      to /access-denied   School View
```

---

## 6. Integration Boundary Notice

> [!NOTE]
> **API Integration Boundary**:
> The authentication UI, validation rules, session state management (`useAuth`), and route protection guards are fully operational. Live authentication requests connect to `/api/auth/*` through the typed `AuthService` adapter. If backend services are not running, the application surfaces clear service availability messages and strictly prohibits fake logins or mock credential bypass.
